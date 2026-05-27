import scrapy
import json
import re
from urllib.parse import urlencode
from cigar_scraper.items import CigarScraperItem, CigarPack


SCRAPEOPS_API_KEY = '5166a8a1-ef21-4a0c-97c0-3d15dd02ceb3'


class CigarFinderSpider(scrapy.Spider):
    name = 'cigarfinder'
    allowed_domains = ['cigarfinder.com', 'proxy.scrapeops.io']
    start_urls = ['https://www.cigarfinder.com/brands']

    # Use ScrapeOps proxy — CigarFinder is JS-heavy but JSON-LD is server-rendered
    use_selenium = False

    def get_proxy_url(self, url):
        payload = {
            'api_key': SCRAPEOPS_API_KEY,
            'url': url,
            'render_js': 'true',   # CigarFinder needs JS for JSON-LD injection
            'wait': '2000',         # wait 2s for JS to settle
        }
        return 'https://proxy.scrapeops.io/v1/?' + urlencode(payload)

    def start_requests(self):
        yield scrapy.Request(
            url=self.get_proxy_url('https://www.cigarfinder.com/brands'),
            callback=self.parse_brands
        )

    # ── Step 1: Get all brand slugs from /brands ──────────────────────────────
    def parse_brands(self, response):
        self.logger.info(f'Parsing brands page, status={response.status}')

        # Brand links: /brands/oliva, /brands/arturo-fuente, etc.
        brand_links = response.css('a[href*="/brands/"]::attr(href)').getall()
        brand_links = list(set([
            l for l in brand_links
            if re.match(r'^/brands/[a-z0-9\-]+$', l)
        ]))

        self.logger.info(f'Found {len(brand_links)} brand links')

        for link in brand_links:
            full_url = f'https://www.cigarfinder.com{link}'
            yield scrapy.Request(
                url=self.get_proxy_url(full_url),
                callback=self.parse_brand_page,
                cb_kwargs={'brand_url': full_url}
            )

    # ── Step 2: Get all cigar slugs from /brands/{slug} ───────────────────────
    def parse_brand_page(self, response, brand_url):
        self.logger.info(f'Parsing brand page: {brand_url}')

        # Product links: /cigars/oliva-serie-v-melanio-robusto
        cigar_links = response.css('a[href*="/cigars/"]::attr(href)').getall()
        cigar_links = list(set([
            l for l in cigar_links
            if re.match(r'^/cigars/[a-z0-9\-]+$', l)
        ]))

        self.logger.info(f'Found {len(cigar_links)} cigars on {brand_url}')

        for link in cigar_links:
            full_url = f'https://www.cigarfinder.com{link}'
            yield scrapy.Request(
                url=self.get_proxy_url(full_url),
                callback=self.parse_product_page,
                cb_kwargs={'prod_url': full_url}
            )

        # Handle pagination: /brands/oliva?page=2
        next_page = response.css('a[rel="next"]::attr(href)').get()
        if next_page:
            full_next = f'https://www.cigarfinder.com{next_page}' if next_page.startswith('/') else next_page
            yield scrapy.Request(
                url=self.get_proxy_url(full_next),
                callback=self.parse_brand_page,
                cb_kwargs={'brand_url': full_next}
            )

    # ── Step 3: Extract JSON-LD from product page ─────────────────────────────
    def parse_product_page(self, response, prod_url):
        self.logger.info(f'Parsing product: {prod_url}')

        # Extract all JSON-LD blocks
        jsonld_blocks = response.css('script[type="application/ld+json"]::text').getall()

        product_data = None
        offers_data = []

        for block in jsonld_blocks:
            try:
                data = json.loads(block)

                # Handle @graph arrays
                if isinstance(data, dict) and data.get('@graph'):
                    data = data['@graph']

                items = data if isinstance(data, list) else [data]

                for item in items:
                    schema_type = item.get('@type', '')

                    if schema_type == 'Product':
                        product_data = item

                    elif schema_type == 'ItemList':
                        # CigarFinder uses ItemList for multi-retailer offers
                        for list_item in item.get('itemListElement', []):
                            offer = list_item.get('item', list_item)
                            if offer.get('@type') in ('Offer', 'AggregateOffer'):
                                offers_data.append(offer)

            except (json.JSONDecodeError, KeyError, TypeError) as e:
                self.logger.debug(f'JSON-LD parse error on {prod_url}: {e}')
                continue

        if not product_data:
            self.logger.warning(f'No Product JSON-LD found on {prod_url}')
            return

        # ── Build CigarScraperItem from JSON-LD ───────────────────────────────
        cigar = CigarScraperItem()
        cigar['name'] = product_data.get('name', '').strip()
        cigar['prod_url'] = prod_url
        cigar['brand'] = self._extract_brand(product_data)
        cigar['sub_brand'] = ''

        # Attributes from additionalProperty array
        attrs = {
            prop.get('name', '').lower(): prop.get('value', '')
            for prop in product_data.get('additionalProperty', [])
            if isinstance(prop, dict)
        }

        cigar['shape'] = attrs.get('shape', attrs.get('cigar shape', ''))
        cigar['strength'] = attrs.get('strength', '')
        cigar['origin'] = attrs.get('origin', attrs.get('country', ''))
        cigar['length'] = attrs.get('length', attrs.get('cigar length', ''))
        cigar['ring'] = attrs.get('ring gauge', attrs.get('ring', ''))

        # ── Extract packs/offers ──────────────────────────────────────────────
        packs = []

        # Offers directly on the Product
        raw_offers = product_data.get('offers', [])
        if isinstance(raw_offers, dict):
            raw_offers = [raw_offers]
        all_offers = raw_offers + offers_data

        for offer in all_offers:
            if not isinstance(offer, dict):
                continue

            price = offer.get('price') or offer.get('lowPrice')
            if not price:
                continue

            pack = CigarPack()
            pack['name'] = offer.get('name', offer.get('description', 'Single'))
            pack['price'] = str(price)
            availability_url = offer.get('availability', '')
            pack['availability'] = (
                'In Stock' if 'InStock' in availability_url
                else 'Out of Stock'
            )
            packs.append(dict(pack))

        if not packs:
            # Fallback: try aggregateRating price
            agg = product_data.get('offers', {})
            if isinstance(agg, dict) and agg.get('lowPrice'):
                pack = CigarPack()
                pack['name'] = 'Single'
                pack['price'] = str(agg['lowPrice'])
                pack['availability'] = 'In Stock'
                packs.append(dict(pack))

        if not packs:
            self.logger.warning(f'No offers/packs found for {prod_url}')
            return

        cigar['packs'] = packs

        if cigar['name']:
            yield cigar

    def _extract_brand(self, product_data):
        brand = product_data.get('brand', {})
        if isinstance(brand, dict):
            return brand.get('name', '')
        if isinstance(brand, str):
            return brand
        # Fallback: first word of name
        return product_data.get('name', '').split()[0] if product_data.get('name') else ''
