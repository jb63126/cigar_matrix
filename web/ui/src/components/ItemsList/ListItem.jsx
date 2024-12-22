import { Box, Grid, Link, Typography } from '@mui/material'
import React from 'react'
import './ListItem.css'
import VerticalTable from './VerticalTable'
import { capitalize, generateShareUrl } from '../../app.constants'
import {
    FacebookShareButton,
    TwitterShareButton,
    RedditShareButton,
    EmailShareButton,
    WhatsappShareButton,
    FacebookIcon,
    XIcon,
    WhatsappIcon,
    RedditIcon,
    EmailIcon
} from 'react-share'
import ShareButtonSMS from '../ShareButtonSMS'
import CopyToClipboard from '../CopyToClipboard'


const ListItem = ({ item }) => {
    const shareUrl = `${window.location.origin}/${item._id}`;
    // const shareUrl = encodeURI(`${'https://cigarmatrix.com'}/${item._id}`);
    const title = 'Found a deal on CigarMatrix'

    return (
        <Box sx={{
            border: '1px solid #EEEEEE',
            padding: '0 30px 20px',
            minWidth: '60%',
            // maxWidth: '70%'
        }}>
            <Typography sx={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#00ADB5',
                p: '10px  0'
            }}>
                {item.name}
            </Typography>
            <Grid container spacing={3} alignItems='end'>
                <Grid item xs={12} md={5}
                >
                    <Grid container spacing={2} columnSpacing={5}>
                        <Grid item xs={12} md={6}>
                            <div ><strong>Brand: </strong>{item?.brand || '-'}</div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <div><strong>Length: </strong>{item?.length || '-'}</div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <div><strong>Ring: </strong>{item?.ring || '-'}</div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <div><strong>Shape: </strong>{item?.shape || '-'}</div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <div><strong>Strength: </strong>{item?.strength || '-'}</div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <div><strong>Origin: </strong>{capitalize(item?.origin) || '-'}</div>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid item xs={12} md={5}>
                    {/* <VerticalTable data={item} /> */}
                    <table className='packs-table'>
                        <thead className='packs-tb-head'>
                            <tr>
                                <th>Qty</th>
                                <th>Availability</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {item.packs.map((row, index) => (
                                <tr key={index}>
                                    <td>{row.name}</td>
                                    <td style={{ color: row.availability.toLowerCase().replace(' ', '').includes('instock') ? 'green' : 'red' }}>{row.availability}</td>
                                    <td>{'$' + row.price}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Grid>

                <Grid item xs={12} md={2}
                    sx={{
                        alignSelf: { xs: 'end', md: 'center' },
                        flexDirection: 'column',
                        display: 'flex',
                        justifyContent: { xs: 'end', md: 'center' }
                    }}>
                    <h2 className='site-name'>{item.site_name}</h2>
                    <Link
                        sx={{
                            background: '#00ADB5',
                            margin: { xs: '0 10%', md: '0 5%' },
                            // padding: { xs: '8px 12px', md: '10px 15px' },
                            p: '8px 15px',
                            border: 'none',
                            borderRadius: '50px',
                            color: 'white',
                            fontWeight: { xs: 'none', md: '600' },
                            fontSize: '1rem',
                            textAlign: 'center'
                        }}
                        underline="none"
                        href={item.prod_url}
                        target="_blank"
                    >
                        Visit Store
                    </Link>
                </Grid>
            </Grid>

            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'center', md: 'right' },
                gap: '4px',
                px: '2px',
                mt: { xs: '15px', md: '15px' }
            }}>
                <FacebookShareButton
                    title={title}
                    url={generateShareUrl(shareUrl, 'facebook')}
                    className='share-btn'>
                    <FacebookIcon size={25} round />
                </FacebookShareButton>
                <TwitterShareButton
                    url={generateShareUrl(shareUrl, 'twitter')}
                    title={title}
                    className="share-btn"
                >
                    <XIcon size={25} round />
                </TwitterShareButton>
                <WhatsappShareButton
                    url={generateShareUrl(shareUrl, 'whatsapp')}
                    title={title}
                    className='share-btn'>
                    <WhatsappIcon size={25} round />
                </WhatsappShareButton>
                {/* <RedditShareButton
                    url={generateShareUrl(shareUrl, 'reddit')}
                    title={title}
                    className="share-btn"
                >
                    <RedditIcon size={25} round />
                </RedditShareButton> */}
                <EmailShareButton
                    url={generateShareUrl(shareUrl, 'email')}
                    subject={title}
                    body="Hey, I found a great deal on CigarMatrix."
                    className="share-btn"
                >
                    <EmailIcon size={25} round />
                </EmailShareButton>
                <ShareButtonSMS text={title} url={generateShareUrl(shareUrl, 'sms')} />
                <CopyToClipboard textToCopy={shareUrl} />
            </Box>
        </Box >
    )
}

export default ListItem
