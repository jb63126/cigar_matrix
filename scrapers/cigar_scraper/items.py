# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class CigarScraperItem(scrapy.Item):
    # define the fields for your item here like:
    name = scrapy.Field()
    prod_url = scrapy.Field()
    packs = scrapy.Field()
    brand = scrapy.Field()
    shape = scrapy.Field()
    strength = scrapy.Field()
    ring = scrapy.Field()
    length = scrapy.Field()
    origin = scrapy.Field()
    sub_brand = scrapy.Field()

class CigarPack(scrapy.Item):
    name = scrapy.Field()
    price = scrapy.Field()
    availability = scrapy.Field()