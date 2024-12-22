import React from 'react';
import { ClickAwayListener, IconButton, Tooltip } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';

const CopyToClipboard = ({ textToCopy }) => {
    const [open, setOpen] = React.useState(false);

    const handleTooltipClose = () => {
        setOpen(false);
    };

    const handleTooltipOpen = () => {
        setOpen(true);
        setTimeout(() => {
            handleTooltipClose();
        }, 3000);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            handleTooltipOpen();
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <ClickAwayListener onClickAway={handleTooltipClose}>
            <div>
                <Tooltip
                    PopperProps={{
                        disablePortal: true,
                    }}
                    slotProps={{
                        popper: {
                            modifiers: [
                                {
                                    name: 'offset',
                                    options: {
                                        offset: [0, 0],
                                    },
                                },
                            ],
                        },
                    }}
                    arrow
                    onClose={handleTooltipClose}
                    open={open}
                    disableFocusListener
                    disableHoverListener
                    disableTouchListener
                    title="Link Copied!"
                >
                    <IconButton sx={{ margin: 0, padding: '3px' }} className='share-btn' onClick={handleCopy} aria-label="copy">
                        <ContentCopy />
                    </IconButton>
                </Tooltip>
            </div>
        </ClickAwayListener>

    );
};

export default CopyToClipboard;