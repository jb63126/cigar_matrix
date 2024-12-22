import scrapy
import time


class CigarsInternationalSpider(scrapy.Spider):
    name = "cigars_international"
    allowed_domains = ["www.cigarsinternational.com"]
    start_urls = ["https://www.cigarsinternational.com"]
    use_selenium =  True
    set_timeout = 10

    def start_requests(self):
        yield scrapy.Request(url= 'https://www.cigarsinternational.com', callback=self.parse)

    def parse(self, response):
        print("==========================")
        print(response.text)
