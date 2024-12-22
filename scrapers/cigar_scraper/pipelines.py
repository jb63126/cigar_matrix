# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter
import pymongo
from scrapy.exceptions import DropItem
import datetime

class CigarScraperPipeline:

    def parse_fraction(self, fraction_str):
        """
        Parse a string containing an integer part and a fractional part into a floating-point number.

        :param fraction_str: A string representing a mixed fraction (e.g. "3 1/2")
        :return: A float representing the mixed fraction (e.g. 3.5)
        """
        parts = fraction_str.split()
        try:
            if len(parts) == 1:
                # If there's no fractional part, return the integer part as a float
                if len(parts[0].split(".")) == 2:
                    return float(parts[0])
                return int(parts[0])
        except ValueError:
            print('\nDEBUG - Length is not int or float Convertable\n')
            return None
        
        integer_part = int(parts[0])
        fraction_part = parts[1]

        # Split the fractional part into numerator and denominator
        numerator, denominator = map(int, fraction_part.split('/'))
        
        fraction_value = numerator / denominator
        res = integer_part + fraction_value
        return round(res, 2)


    def process_item(self, item, spider):
        spider_name = getattr(spider, 'name')
        adapter = ItemAdapter(item)

        # INFO: jr_cigar length is in floating point
        # from fractions import Fraction
        # a = '3.62'
        # b = float("0." + a.split('.')[1])
        # c = b.as_integer_ratio()
        # print(str(Fraction(b).limit_denominator()))

        if not adapter.get('name') \
            or (not adapter.get('brand') and not adapter.get('origin') \
                and not adapter.get('shape') and not adapter.get('strength') \
                    and not adapter.get('ring') and not adapter.get('length')):
            raise DropItem(f"\n\nITEM DROPED: Missing item information {item}\n\n")
            

        if adapter.get('ring'):
            adapter['ring'] = int(adapter.get('ring').strip())

        if adapter.get('length'):
            item_len = adapter.get('length').rstrip('"').replace('"', ' ')
            adapter['length'] = self.parse_fraction(item_len)

        if spider_name == 'cigarpage':
            strength = int(adapter.get('strength').strip())
            if strength > 0 and strength <= 33:
                adapter['strength'] = 'Mild'
            elif strength > 33 and strength <= 66:
                adapter['strength'] = 'Medium'
            elif strength > 67 and strength <= 100:
                adapter['strength'] = 'Full'
        
        if spider_name == 'jrcigars':
            adapter['name'] = f"{adapter.get('name')} {adapter.get('sub_brand')}"

        packs = adapter.get('packs')
        if len(packs) == 0:
            raise DropItem(f"\n\nITEM DROPED: Missing packs information {item}\n\n")
        for pack in packs:
            if not pack['price']:
                raise DropItem(f"\n\nMissing price for item {item}\n\n")
            if type(pack['availability']) is bool:
                pack['availability'] = 'In Stock' if pack['availability'] else 'Out of Stock'
            pack['name'] = pack['name'].strip().capitalize()
            price = pack['price'].strip('$')
            pack['price'] = float(price) if len(price.split(".")) == 2 else int(price)
            pack['availability'] = pack['availability'].strip().capitalize()

        adapter['strength'] = adapter.get('strength').strip().capitalize() if adapter.get('strength') else ''
        adapter['shape'] = adapter.get('shape').strip().capitalize() if adapter.get('shape') else ''
        adapter['origin'] = adapter.get('origin').strip().capitalize() if adapter.get('origin') else ''
        adapter['name'] = adapter.get('name').strip() if adapter.get('name') else ''
        adapter['brand'] = adapter.get('brand').strip() if adapter.get('brand') else ''
        adapter['sub_brand'] = adapter.get('sub_brand').strip() if adapter.get('sub_brand') else ''

        return item
    

class MongoPipeline:

    def __init__(self, mongo_uri, mongo_db, batch_size):
        self.mongo_uri = mongo_uri
        self.mongo_db = mongo_db
        self.batch_size = batch_size
        self.items_buffer = []
        self.websites = {
            'cigarpage': 'Cigar Page',
            'neptune_cigar': 'Neptune Cigar',
            'jrcigars': 'JR Cigars',
            'foxcigar': 'Fox Cigar',
            'famous_smoke': 'Famous Smoke',
        }

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            mongo_uri=crawler.settings.get('MONGO_URI', 'mongodb://localhost:27017/'),
            mongo_db=crawler.settings.get('MONGO_DATABASE', 'cigarDB'),
            batch_size=crawler.settings.get('BATCH_SIZE', 500)
        )

    def open_spider(self, spider):
        self.client = pymongo.MongoClient(self.mongo_uri)
        self.db = self.client[self.mongo_db]
        self.collection = self.db['cigars']

    def close_spider(self, spider):
        if self.items_buffer:
            self._flush_buffer()
        self.client.close()

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        spider_name = getattr(spider, 'name')
        cigar_item = adapter.asdict()

        unique_id = cigar_item['name']
        if spider_name == 'cigarpage':
            unique_id = unique_id + cigar_item['packs'][0]['name']
        elif spider_name == 'jrcigars':
            unique_id = f"{unique_id}{cigar_item['length']}{cigar_item['ring']}"

        cigar_item['unique_id'] = unique_id.lower().replace(' ', '').replace('\"', '')
        cigar_item['site_name'] = self.websites[spider_name]
        cigar_item['scraped_at'] = datetime.datetime.now(tz=datetime.timezone.utc)
        self.items_buffer.append(cigar_item)

        # Flush buffer if reached batch size
        if len(self.items_buffer) >= self.batch_size:
            self._flush_buffer()

        return item

    def _flush_buffer(self):
        operations = [pymongo.UpdateOne(
            {'unique_id': item['unique_id']},
            {'$set': item},
            upsert=True
        ) for item in self.items_buffer]
        
        self.collection.bulk_write(operations)
        self.items_buffer = []
