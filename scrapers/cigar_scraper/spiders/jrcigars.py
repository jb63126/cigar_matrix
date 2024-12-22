import scrapy
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
import time
from cigar_scraper.items import CigarPack, CigarScraperItem
from cigar_scraper.constants import CHROME_DRIVER_PATH

class JrcigarsSpider(scrapy.Spider):
    name = "jrcigars"
    allowed_domains = ["www.jrcigars.com"]
    start_urls = ["https://www.jrcigars.com/cigars"]

    def __init__(self, *args, **kwargs):
        super(JrcigarsSpider, self).__init__(*args, **kwargs)
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
        for letter in "0ABCDEFGHIJKLMNOPQRSTUVWXYZ":
            div_id = f"section-{letter}"
            section = response.css(f'div.brand-list-content > div#{div_id}')
            if section:
                brands_list = section.css('.brands-list-content > p')
                for brand in brands_list:
                    brand_link = brand.css('a.link-bare.bold ::attr(href)').get()
                    brand_name = brand.css('a.link-bare.bold ::text').get()
                    if brand_link:
                        yield response.follow(brand_link, self.parse_brand_page, cb_kwargs={'brand': brand_name.strip()})


    def parse_brand_page(self, response, brand):
        rows = response.css('#search-result-items > .row.tile-row')
        prod_urls = rows.css('.item-link > a ::attr(href)').getall()
        for url in prod_urls:
            yield response.follow(url, self.parse_prod_page, cb_kwargs={'brand': brand})
        # TODO: Implement pagination logic here


    def parse_prod_page(self, response, brand):
        cigar_name = response.css('div.page-item > h1 ::text').get().strip()
        sub_brand_size = response.css('div.page-item > h3 ::text').get().strip()
        arr = sub_brand_size.split('\n\n')
        sub_brand = arr[0]

        product = CigarScraperItem()
        product['name'] = cigar_name
        product['prod_url'] = response.url
        product['brand'] = brand
        product['sub_brand'] = sub_brand

        details_cell = response.css('div.cigar-details > div.section-sm').css('div.col-sm-4')
        details = {}
        for cell in details_cell:
            label = cell.css('label.control-label ::text').get()
            value = cell.css('.form-control-static > strong ::text').get()
            if label and value:
                details[label.strip().lower().replace(' ', '-')] = value.strip()

        product['strength'] = details.get('strength')
        product['ring'] = details.get('ring')
        product['length'] = details.get('length')
        product['origin'] = details.get('origin')
        product['shape'] = details.get('shape')

        # Extract packs information
        packs = []
        packs_container = response.css('.add-to-cart-container')
        select_elem = packs_container.css('select#variation-select')
        if select_elem:
            # Get selected option value
            selected_pack = select_elem.css('option[selected]::text').get().strip()
            price = packs_container.css('.jr-price > span ::text').get()
            availability = True if packs_container.css('button.addtocart-button.btn-light-green') else False
            packs.append({ 'name': selected_pack, 'price': price, 'availability': availability })

            # Get remaining options values
            pack_data = self.handle_packs_select(response, selected_pack)
            packs.extend(pack_data)
        else:
            # Static number of packs
            pack = packs_container.css('.variation-attributes-container > div > p ::text').get()
            price = packs_container.css('.jr-price > span ::text').get()
            availability = True if packs_container.css('button.addtocart-button.btn-light-green') else False
            packs.append({ 'name': pack.strip(), 'price': price, 'availability': availability })
        
        cigar_packs = []
        for pack in packs:
            new_pack = CigarPack()
            new_pack['name'] = pack['name']
            new_pack['price'] = pack['price']
            new_pack['availability'] = pack['availability']
            cigar_packs.append(dict(pack))
        product['packs'] = cigar_packs
        yield product


    def handle_packs_select(self, response, selected_option):
        self.driver.get(response.url)
        wait = WebDriverWait(self.driver, 10)
        pack_data = []
        try:
            # Find the select element
            select_element = wait.until(EC.presence_of_element_located((By.ID, "variation-select")))
            select = Select(select_element)
            for index, _option in enumerate(select.options):
                # Refresh the refrences to avoid Stale Element exception
                select_element = wait.until(EC.presence_of_element_located((By.ID, "variation-select")))
                select = Select(select_element)
                option = select.options[index]
                if not option.text.strip() == selected_option:
                    pack = option.text
                    select.select_by_visible_text(option.text)
                    time.sleep(5)

                    # Wait for AJAX call to update the price
                    wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "jr-price"), '$'))
                    price = self.driver.find_element(By.CLASS_NAME, 'jr-price').text

                    availability = True
                    try:
                        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "button.addtocart-button.btn-light-green")))
                    except Exception as e:
                        availability = False
                    pack_data.append({'name': pack, 'price': price, 'availability': availability})
        except Exception as e:
            print(e)

        return pack_data


    def __del__(self):
        self.driver.quit()








