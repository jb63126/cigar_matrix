import scrapy
import undetected_chromedriver as uc
from scrapy.http import HtmlResponse

import ssl
from urllib.parse import urlencode, urldefrag




class BestcigarPricesSpider(scrapy.Spider):
    name = "bestcigar_prices"
    allowed_domains = ["bestcigarprices.com", "www.bestcigarprices.com", "scrapeops.io"]
    start_urls = ["https://www.bestcigarprices.com/cigar-directory/brands/"]
    use_selenium =  True
    set_timeout = 10

    # def __init__(self, *args, **kwargs):
    #     super(BestcigarPricesSpider, self).__init__(*args, **kwargs)
    #     chrome_options = uc.ChromeOptions()
    #     chrome_options.add_argument("--headless")
    #     chrome_options.add_argument("--disable-gpu")
    #     chrome_options.add_argument("--no-sandbox")
    #     chrome_options.add_argument("--disable-dev-shm-usage")
    #     chrome_options.add_argument("--log-level=3")
    #     chrome_options.add_argument("--enable-javascript")
    #     # Set up custom headers
    #     chrome_options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
    #     chrome_options.add_argument("--accept=text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7")
    #     chrome_options.add_argument("--accept-language=en-PK,en-US;q=0.9,en;q=0.8")
    #     chrome_options.add_argument('--sec-ch-ua="Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"')
    #     chrome_options.add_argument("--sec-ch-ua-platform=macOS")
    #     chrome_options.add_argument("--sec-ch-ua-platform-version=13.4.0")
    #     chrome_options.add_argument("--upgrade-insecure-requests=1")

    #     ssl._create_default_https_context = ssl._create_unverified_context
    #     driver_path = "chromedriver-mac-x64/chromedriver"
    #     self.driver = uc.Chrome(driver_executable_path=driver_path, options=chrome_options)


    from urllib.parse import urlencode
    url = 'https://www.bestcigarprices.com/cigar-directory/cigars/'
    payload = {'api_key': '5166a8a1-ef21-4a0c-97c0-3d15dd02ceb3', 'url': url}
    proxy_url = 'https://proxy.scrapeops.io/v1/?' + urlencode(payload)

    def get_proxy_url(self, url):
        payload = {'api_key': '5166a8a1-ef21-4a0c-97c0-3d15dd02ceb3', 'url': url}
        proxy_url = 'https://proxy.scrapeops.io/v1/?' + urlencode(payload)
        return proxy_url

    def start_requests(self):
        # url = 'https://www.bestcigarprices.com/cigar-directory/cigars/'
        # url = 'https://www.bestcigarprices.com/cigar-directory/acid-blue-cigars/acid-kuba-kuba-maduro-19185/'
        url = 'https://www.bestcigarprices.com/cigar-directory/brands/'
        yield scrapy.Request(url=self.get_proxy_url(url), callback=self.parse)

    def parse(self, response):
        print(response.text)

        # name = response.css('.center-block > span > h1 ::text').get()
        # sub_brand = response.css('.center-block > a > span ::text').get()

        # cigar_info = {
        #     'name': name,
        #     'brand': 'BRAND',
        #     'sub_brand': sub_brand,
        #     'prod_url': response.url
        # }

        # attributes = response.css('table.attribute-styled.card-body').css('tr')

        # for attrib in attributes:
        #     label = attrib.css('td.attribute-key ::text').get()
        #     value = attrib.css('td.attribute-value ::text').get()
        #     if label and value:
        #         cigar_info[label.strip().lower()] = value.strip()

        # packs = []
        # packs_contain = response.css('.cart > div.quantity.quantity-sisters')
        # if packs_contain:
        #     # Get default selected pack
        #     pack_name = packs_contain.css('span.active.arrow_box ::text').get().strip()
        #     avail = packs_contain.css('span.active.arrow_box > div.stock ::text').get().strip()
        #     price = response.css('.price > span ::text').get().strip()
        #     packs.append(dict({ 'name': pack_name, 'price': price, 'availability': avail }))

        # else:
        #     # might be sampler pack, so single price
        #     packs_contain = response.css('.cart > div.quantity')
        #     pack_name = packs_contain.css('.quantity-current-name ::text').get().strip()
        #     avail = response.css('.stock ::text').get().strip()
        #     price = response.css('.price > span ::text').get().strip()
        #     packs.append(dict({ 'name': pack_name, 'price': price, 'availability': avail }))

        # print(cigar_info)

        # print('Pack: ', pack)
        # print('Price: ', price)
        # print('Availl: ', avail)

        # self.driver.get(response.url)

        # # self.driver.implicitly_wait(20)
        # body = self.driver.page_source
        # response = HtmlResponse(self.driver.current_url, body=body, encoding='utf-8')

        # f = open("test.html", "a")
        # f.write(str(response.body))
        # f.close()

        # item_container = response.css('#main_item_container')
        # print(response.text)

        # if item_container:
        print("********************************************************\n\n\n")

