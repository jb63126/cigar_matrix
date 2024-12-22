import scrapy
from cigar_scraper.items import CigarScraperItem, CigarPack


class NeptuneCigarSpider(scrapy.Spider):
    name = "neptune_cigar"
    allowed_domains = ["neptunecigar.com"]
    start_urls = ["https://www.neptunecigar.com/cigars?pg=1&nb=48&sort=BeS"]

    def parse(self, response):
        print("\n\n*********************************************************")
        print(f"Started scraping URL: {response.url}")
        print("*********************************************************\n\n")

        # Extract product page url and follow
        prod_urls = response.css('.product_item').css('a.product_name ::attr(href)').getall()
        for url in prod_urls:
            yield response.follow(url, self.parse_prod_page)
        # Go to the next page
        list_items = response.css('div#pagination1 li')
        next_page = list_items[-1].css('a.pagination_buttons ::attr(href)').get()
        if next_page is not None:
            yield response.follow(next_page, callback=self.parse)


    def parse_prod_page(self, response):
        product = CigarScraperItem()
        # Get prices for all packs
        packs_list = []
        table = response.css('#product_table >tr')
        for row in table[1:]:
            pack = CigarPack()
            pack['name'] = row.css('td.lbup:not(.av_details) ::text').get()
            pack['availability'] = row.css('td div.lbup ::text').get()
            pack['price'] = row.css('td.important_price ::text').get()
            packs_list.append(dict(pack))
        product['name'] = response.css('.product_primary_info h1 span::text').get()
        product['packs'] = packs_list
        product['prod_url'] = response.url

        # Desired fields to extract, the key text is as per on the website
        fields = {
            "Brands": "brand",
            "Cigar Shape": "shape",
            "Strength": "strength",
            "Cigar Ring Gauge": "ring",
            "Cigar Length": "length",
            "Origin": "origin",
        }

        for field in fields:
            # XPath to match <li> elements that have the desired fields as titles
            value = response.xpath(
                f"//div[@id='pr_tabSpec']//li/div[contains(text(),'{field}')]/following-sibling::div//meta/@content | "
                f"//div[@id='pr_tabSpec']//li/div[contains(text(),'{field}')]/following-sibling::div//div[contains(@class,'onHover')]/text()"
            ).get(default='').strip()

            if not value:  # Try an alternative approach if the text extraction fails
                value = response.xpath(
                    f"//div[@id='pr_tabSpec']//li/div[contains(text(),'{field}')]/following-sibling::div/div[contains(text(),'{field}')]"
                ).xpath('following-sibling::div//meta/@content | following-sibling::div//div[contains(@class,"onHover")]/text()').get(default='').strip()

            if field == "Strength":
                value = response.xpath("//div[@id='strengthCursor']//div[not(@id)]/text()").get(default='').strip()
            
            # Assign the extracted value to the results dictionary
            product[fields[field]] = value

        yield product

        
        
