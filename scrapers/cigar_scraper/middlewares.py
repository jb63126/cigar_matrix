# Define here the models for your spider middleware
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/spider-middleware.html

from scrapy import signals

# useful for handling different item types with a single interface
from itemadapter import is_item, ItemAdapter

from scrapy.http import HtmlResponse
# from selenium import webdriver
# from selenium.webdriver.chrome.service import Service
# from selenium.webdriver.chrome.options import Options
# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# from webdriver_manager.chrome import ChromeDriverManager

import undetected_chromedriver as uc
import ssl
import time
from scrapy.downloadermiddlewares.offsite import OffsiteMiddleware
from cigar_scraper.constants import CHROME_DRIVER_PATH


class CigarScraperSpiderMiddleware:
    # Not all methods need to be defined. If a method is not defined,
    # scrapy acts as if the spider middleware does not modify the
    # passed objects.

    @classmethod
    def from_crawler(cls, crawler):
        # This method is used by Scrapy to create your spiders.
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_spider_input(self, response, spider):
        # Called for each response that goes through the spider
        # middleware and into the spider.

        # Should return None or raise an exception.
        return None

    def process_spider_output(self, response, result, spider):
        # Called with the results returned from the Spider, after
        # it has processed the response.

        # Must return an iterable of Request, or item objects.
        for i in result:
            yield i

    def process_spider_exception(self, response, exception, spider):
        # Called when a spider or process_spider_input() method
        # (from other spider middleware) raises an exception.

        # Should return either None or an iterable of Request or item objects.
        pass

    def process_start_requests(self, start_requests, spider):
        # Called with the start requests of the spider, and works
        # similarly to the process_spider_output() method, except
        # that it doesn’t have a response associated.

        # Must return only requests (not items).
        for r in start_requests:
            yield r

    def spider_opened(self, spider):
        spider.logger.info("Spider opened: %s" % spider.name)


class CigarScraperDownloaderMiddleware:
    # Not all methods need to be defined. If a method is not defined,
    # scrapy acts as if the downloader middleware does not modify the
    # passed objects.

    @classmethod
    def from_crawler(cls, crawler):
        # This method is used by Scrapy to create your spiders.
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_request(self, request, spider):
        # Called for each request that goes through the downloader
        # middleware.

        # Must either:
        # - return None: continue processing this request
        # - or return a Response object
        # - or return a Request object
        # - or raise IgnoreRequest: process_exception() methods of
        #   installed downloader middleware will be called
        return None

    def process_response(self, request, response, spider):
        # Called with the response returned from the downloader.

        # Must either;
        # - return a Response object
        # - return a Request object
        # - or raise IgnoreRequest
        return response

    def process_exception(self, request, exception, spider):
        # Called when a download handler or a process_request()
        # (from other downloader middleware) raises an exception.

        # Must either:
        # - return None: continue processing this exception
        # - return a Response object: stops process_exception() chain
        # - return a Request object: stops process_exception() chain
        pass

    def spider_opened(self, spider):
        spider.logger.info("Spider opened: %s" % spider.name)

class SeleniumMiddleware:
    def __init__(self):
        self.driver = None

    def initialize_driver(self, set_timeout):
        chrome_options = uc.ChromeOptions()
        chrome_options.add_argument(str("--headless"))
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--log-level=3")
        chrome_options.add_argument("--enable-javascript")
        # chrome_options.add_experimental_option("excludeSwitches", ["enable-logging"])  # Exclude logging

        # Set up custom headers
        # chrome_options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')
        # chrome_options.add_argument('accept=text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7')
        # chrome_options.add_argument('accept-language=en-PK,en-US;q=0.9,en;q=0.8')
        # chrome_options.add_argument('sec-ch-ua="Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"')
        # chrome_options.add_argument('sec-ch-ua-platform=macOS')
        # chrome_options.add_argument('sec-ch-ua-platform-version=13.4.0')
        # chrome_options.add_argument('upgrade-insecure-requests=1')

        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
        chrome_options.add_argument("--accept=text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7")
        chrome_options.add_argument("--accept-language=en-PK,en-US;q=0.9,en;q=0.8")
        chrome_options.add_argument('--sec-ch-ua="Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"')
        chrome_options.add_argument("--sec-ch-ua-platform=macOS")
        chrome_options.add_argument("--sec-ch-ua-platform-version=13.4.0")
        chrome_options.add_argument("--upgrade-insecure-requests=1")
        # driver_path = "chromedriver-mac-x64/chromedriver"
        # service = Service(ChromeDriverManager().install())
        # service = Service(driver_path)
        # self.driver = webdriver.Chrome(service=service, options=chrome_options)
        ssl._create_default_https_context = ssl._create_unverified_context
        self.driver = uc.Chrome(driver_executable_path=CHROME_DRIVER_PATH, options=chrome_options)


    def process_request(self, request, spider):
        if not self.driver:
            if getattr(spider, 'use_selenium', False):
                self.initialize_driver(getattr(spider, 'set_timeout', 0))

        if getattr(spider, 'use_selenium', False):  # Check if this spider uses Selenium
            self.driver.get(request.url)
            body = self.driver.page_source
            return HtmlResponse(self.driver.current_url, body=body, encoding='utf-8', request=request)
        else:
            return None

    def __del__(self):
        if self.driver:
            self.driver.quit()


# class BypassOffsiteMiddleware(OffsiteMiddleware):
#     def process_spider_output(self, response, result, spider):
#         if 'splash' in response.flags:
#             return result
#         return super().process_spider_output(response, result, spider)