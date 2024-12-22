import scrapy
from cigar_scraper.items import CigarScraperItem, CigarPack
from scrapy.http import HtmlResponse
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from cigar_scraper.constants import CHROME_DRIVER_PATH


class CigarpageSpider(scrapy.Spider):
    name = "cigarpage"
    allowed_domains = ["www.cigarpage.com", "cigarpage.com", "localhost"]
    start_urls = ["https://www.cigarpage.com/brands"]

    def __init__(self, *args, **kwargs):
        super(CigarpageSpider, self).__init__(*args, **kwargs)
        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--log-level=3")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-logging"])
        service = Service(CHROME_DRIVER_PATH)
        self.driver = webdriver.Chrome(service=service, options=chrome_options)

    def parse(self, response):
        # link = 'https://www.cigarpage.com/601-blue-label-maduro.html'
        # yield response.follow(link, self.parse_cigar_page, cb_kwargs={'brand': 'brand_name'})
        # ======================================================
        brand_list = []
        current_brand = None
        brand_name = ''
        for element in response.css('div.row > div.col-xs-12.col-sm-4 > *'):
            if 'brand-summary' in element.attrib.get('class', ''):
                if current_brand:
                    # Append the previous brand's data to the brand list
                    brand_list.append(current_brand)
                brand_name = element.css('span::text').get().strip()
                current_brand = {'brand_name': brand_name, 'urls': []}
            elif 'brand-item' in element.attrib.get('class', ''):
                if current_brand:
                    link = element.css('a::attr(href)').get()
                    yield response.follow(link, self.parse_cigar_page, cb_kwargs={'brand': brand_name})
                    # current_brand['urls'].append(link)
        if current_brand:
            # Append the last brand's data to the brand list
            brand_list.append(current_brand)
        # ======================================================
        # for brand in brand_list:
        #     for link in brand['urls']:
        #         # link = "https://www.cigarpage.com/601-blue-label-maduro.html"
        #         # link = "https://www.cigarpage.com/brands"
        #         yield response.follow(link, self.parse_cigar_page, cb_kwargs={'brand': brand['brand_name']})

    
    def parse_cigar_page(self, response, brand):
        self.driver.get(response.url)
        wait = WebDriverWait(self.driver, 8)
        try:
            tbody = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "table.cigar-grid > tbody")))
            if tbody:
                response = HtmlResponse(self.driver.current_url, body=self.driver.page_source, encoding='utf-8')
                rows = response.css('table.cigar-grid > tbody > tr')
                # TODO: For some links only one row is scraped, add retries for them
                for row in rows:
                    name = row.css('.cigar-alt-name ::text').get()
                    pack = row.css('td:nth-child(2) > span ::text').get().strip()
                    availability = row.css('.availability.out-of-stock span ::text').get()
                    availability = False if availability else True
                    price = row.css('span.price ::text').get().strip()

                    cigar_info = CigarScraperItem()
                    cigar_info['name'] = name
                    cigar_info['prod_url'] = response.url
                    cigar_info['brand'] = brand
                    cigar_info['packs'] = [{
                            'name': pack,
                            'availability': availability,
                            'price': price
                        }]

                    # Extract cigar attriibutes info
                    attributes = {}
                    attr_rows = row.css('.cigar-attr-row:not(.visible-xs)')
                    for attr in attr_rows:
                        label = attr.css('.cigar-attr-label ::text').get().strip()
                        value = attr.css('.cigar-attr-value ::text').get().strip()
                        if not value:
                            value = attr.css('.cigar-attr-value div.progress-bar.strength ::attr(aria-valuenow)').get()
                        if value:
                            attributes[label.lower()] = value

                    if attributes.get('size'):
                        size = attributes.get('size').lower().strip('()').split('x')
                        if len(size) == 2:
                            cigar_info['length'] = size[0].strip()
                            cigar_info['ring'] = size[1].strip()
                    cigar_info['shape'] = attributes['shape']
                    cigar_info['origin'] = attributes['origin']
                    cigar_info['strength'] = attributes['strength']
                    yield cigar_info

        except TimeoutException as e:
            print('[DEBUG] - Timeout occcurs, could not find element : ', e.msg)
