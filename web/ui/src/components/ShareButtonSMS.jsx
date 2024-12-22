import React from 'react';
import { Button, IconButton } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
// import messageLogo from '../assets/message.svg'
import messageLogo from '../assets/circle.png'

const ShareButtonSMS = ({ text, url }) => {
  const handleShareClick = () => {
    // Construct the SMS link
    const message = `${text} ${url}`;
    const encodedMessage = encodeURIComponent(message);
    const smsLink = `sms:?body=${encodedMessage}`;

    // Open the messaging app with the constructed link
    window.location.href = smsLink;
  };

  return (
    <div
      style={{
        cursor: 'pointer',
        minWidth: 25,
        width: 25,
        height: 25,
        borderRadius: '50%',
      }}
      onClick={handleShareClick}>
      <img width='25px' src={messageLogo} />
    </div>
  );
};

export default ShareButtonSMS;