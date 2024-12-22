import { Box } from '@mui/material';
import React, { useEffect, useState } from 'react';

const PrivacyPolicy = () => {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    fetch('/policy.html')
      .then(response => response.text())
      .then(data => {
        setHtmlContent(data);
      })
      .catch(error => {
        console.error('Error fetching the HTML:', error);
      });
  }, []);

  return (
    <Box sx={{
        m: {xs: '5% 0', md: '5% 10%'},
        p: {xs: '5% 5%', md: '5% 5%'},
        border: '1px solid #EEEEEE'
    }}>
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </Box>
  );
};

export default PrivacyPolicy;