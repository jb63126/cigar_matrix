import React, { useState } from 'react'
import { Box, Chip, Collapse, Grid, IconButton, Link, Tooltip, Typography } from '@mui/material'
import { ExpandMore, ExpandLess, OpenInNew } from '@mui/icons-material'
import {
    RedditShareButton, RedditIcon,
    TwitterShareButton, XIcon,
    WhatsappShareButton, WhatsappIcon,
    EmailShareButton, EmailIcon,
} from 'react-share'

// UTM source map — one per retailer so you can see which sends most traffic
const UTM_SOURCES = {
    'Cigar Page':          'cigarpage',
    'Neptune Cigar':       'neptune',
    'Famous Smoke':        'famoussmoke',
    'JR Cigars':           'jrcigars',
    'Best Cigar Prices':   'bestcigarprices',
}

const RETAILER_COLORS = {
    'Cigar Page':          '#e05c1a',
    'Neptune Cigar':       '#1a6ee0',
    'Famous Smoke':        '#c0392b',
    'JR Cigars':           '#27ae60',
    'Best Cigar Prices':   '#8e44ad',
}

function buildUtmUrl(url, siteName, cigarName) {
    const source = UTM_SOURCES[siteName] || siteName.toLowerCase().replace(/\s/g, '')
    const params = new URLSearchParams({
        utm_source: 'cigarmatrix',
        utm_medium: 'price_comparison',
        utm_campaign: 'deal_click',
        utm_content: source,
        utm_term: cigarName.toLowerCase().replace(/\s+/g, '_').slice(0, 50),
    })
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}${params.toString()}`
}

function StrengthBadge({ strength }) {
    const colors = {
        mild: '#27ae60',
        medium: '#e67e22',
        full: '#c0392b',
        'medium-full': '#d35400',
        'mild-medium': '#2ecc71',
    }
    const color = colors[strength?.toLowerCase()] || '#7f8c8d'
    return (
        <Chip
            label={strength || 'Unknown'}
            size="small"
            sx={{ backgroundColor: color, color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
        />
    )
}

function PriceRow({ retailer, cigarName, isLowest }) {
    const inStockPacks = retailer.packs.filter(p =>
        p.availability?.toLowerCase().includes('in stock') && p.price
    )
    const lowestPack = inStockPacks.sort((a, b) => a.price - b.price)[0]
    const allPacks = retailer.packs.filter(p => p.price)
    const color = RETAILER_COLORS[retailer.site_name] || '#555'
    const utmUrl = buildUtmUrl(retailer.prod_url, retailer.site_name, cigarName)

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1,
            px: 1.5,
            mb: 0.5,
            borderRadius: 2,
            border: isLowest ? '2px solid #00ADB5' : '1px solid #eee',
            background: isLowest ? '#f0fffe' : 'white',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                    width: 10, height: 10, borderRadius: '50%',
                    backgroundColor: color, flexShrink: 0
                }} />
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#333' }}>
                    {retailer.site_name}
                </Typography>
                {isLowest && (
                    <Chip label="Best Price" size="small"
                        sx={{ backgroundColor: '#00ADB5', color: 'white', fontSize: '0.65rem', height: 18 }} />
                )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {lowestPack ? (
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: isLowest ? '#00ADB5' : '#333' }}>
                        ${lowestPack.price.toFixed(2)}
                        <Typography component="span" sx={{ fontSize: '0.7rem', color: '#999', ml: 0.5 }}>
                            ({lowestPack.name})
                        </Typography>
                    </Typography>
                ) : (
                    <Typography sx={{ fontSize: '0.8rem', color: '#e74c3c', fontStyle: 'italic' }}>
                        Out of Stock
                    </Typography>
                )}
                <Link
                    href={utmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="none"
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 0.5,
                        background: isLowest ? '#00ADB5' : '#f5f5f5',
                        color: isLowest ? 'white' : '#555',
                        px: 1.5, py: 0.5,
                        borderRadius: '50px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        '&:hover': { opacity: 0.85 }
                    }}
                >
                    Buy <OpenInNew sx={{ fontSize: '0.75rem' }} />
                </Link>
            </Box>
        </Box>
    )
}

const CompareCard = ({ item }) => {
    const [expanded, setExpanded] = useState(false)
    const shareUrl = `${window.location.origin}/c/${item._id}`
    const shareTitle = `Found a deal on ${item.name} — CigarMatrix`

    // Sort retailers: in-stock first, then by lowest price
    const sortedRetailers = [...(item.retailers || [])].sort((a, b) => {
        const aPrice = a.packs.find(p => p.availability?.toLowerCase().includes('in stock'))?.price ?? Infinity
        const bPrice = b.packs.find(p => p.availability?.toLowerCase().includes('in stock'))?.price ?? Infinity
        return aPrice - bPrice
    })

    const inStockRetailers = sortedRetailers.filter(r =>
        r.packs.some(p => p.availability?.toLowerCase().includes('in stock'))
    )

    return (
        <Box sx={{
            background: 'white',
            border: '1px solid #e8e8e8',
            borderRadius: 3,
            mb: 2,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            '&:hover': { boxShadow: '0 3px 12px rgba(0,0,0,0.1)' },
            transition: 'box-shadow 0.2s',
        }}>
            {/* Header */}
            <Box sx={{ p: '14px 20px 10px', borderBottom: '1px solid #f0f0f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#222', lineHeight: 1.3 }}>
                            {item.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: '#888', mt: 0.3 }}>
                            {item.brand}{item.sub_brand ? ` · ${item.sub_brand}` : ''}
                        </Typography>
                    </Box>
                    {item.best_price && (
                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            <Typography sx={{ fontSize: '0.65rem', color: '#aaa', textTransform: 'uppercase' }}>
                                From
                            </Typography>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#00ADB5', lineHeight: 1 }}>
                                ${item.best_price.toFixed(2)}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Attributes row */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.2, alignItems: 'center' }}>
                    {item.strength && <StrengthBadge strength={item.strength} />}
                    {item.shape && (
                        <Chip label={item.shape} size="small"
                            sx={{ fontSize: '0.7rem', height: 20, background: '#f5f5f5' }} />
                    )}
                    {item.ring && item.length && (
                        <Chip label={`${item.length}" × ${item.ring}`} size="small"
                            sx={{ fontSize: '0.7rem', height: 20, background: '#f5f5f5' }} />
                    )}
                    {item.origin && (
                        <Chip label={item.origin} size="small"
                            sx={{ fontSize: '0.7rem', height: 20, background: '#f5f5f5' }} />
                    )}
                    <Chip
                        label={`${inStockRetailers.length} of ${sortedRetailers.length} retailers`}
                        size="small"
                        sx={{
                            fontSize: '0.7rem', height: 20,
                            background: inStockRetailers.length > 0 ? '#e8f8f5' : '#fde',
                            color: inStockRetailers.length > 0 ? '#00ADB5' : '#e74c3c',
                            fontWeight: 600,
                        }}
                    />
                </Box>
            </Box>

            {/* Price comparison rows */}
            <Box sx={{ p: '10px 16px' }}>
                {sortedRetailers.slice(0, expanded ? undefined : 3).map((retailer, i) => (
                    <PriceRow
                        key={retailer.site_name}
                        retailer={retailer}
                        cigarName={item.name}
                        isLowest={i === 0 && inStockRetailers.length > 0}
                    />
                ))}

                {sortedRetailers.length > 3 && (
                    <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                        <IconButton size="small" onClick={() => setExpanded(!expanded)}
                            sx={{ color: '#00ADB5', fontSize: '0.75rem', gap: 0.5 }}>
                            {expanded ? <><ExpandLess fontSize="small" /> Show less</> : <><ExpandMore fontSize="small" /> +{sortedRetailers.length - 3} more retailers</>}
                        </IconButton>
                    </Box>
                )}
            </Box>

            {/* Share row */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                gap: '4px', px: 2, pb: 1.5, pt: 0.5,
                borderTop: '1px solid #f5f5f5',
            }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#bbb', mr: 0.5 }}>Share:</Typography>
                <RedditShareButton url={shareUrl} title={shareTitle}>
                    <RedditIcon size={22} round />
                </RedditShareButton>
                <TwitterShareButton url={shareUrl} title={shareTitle}>
                    <XIcon size={22} round />
                </TwitterShareButton>
                <WhatsappShareButton url={shareUrl} title={shareTitle}>
                    <WhatsappIcon size={22} round />
                </WhatsappShareButton>
                <EmailShareButton url={shareUrl} subject={shareTitle} body="Check out this deal on CigarMatrix:">
                    <EmailIcon size={22} round />
                </EmailShareButton>
            </Box>
        </Box>
    )
}

export default CompareCard
