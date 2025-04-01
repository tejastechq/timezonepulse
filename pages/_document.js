import { Html, Head, Main, NextScript } from 'next/document';
import { getCookieParser } from 'next/dist/server/api-utils';

/**
 * Custom Document to apply nonces to scripts for CSP
 */
function Document(props) {
  // Get the nonce from the cookie if available
  const nonce = props.__NEXT_DATA__.nonce || '';

  return (
    <Html lang="en">
      <Head nonce={nonce} />
      <body>
        <Main />
        <NextScript nonce={nonce} />
      </body>
    </Html>
  );
}

// Server side props to extract nonce from cookies
Document.getInitialProps = async (ctx) => {
  const originalProps = await ctx.defaultGetInitialProps(ctx);
  
  try {
    // Try to get the nonce from cookies
    const cookieParser = getCookieParser(ctx.req?.headers?.cookie || '');
    const cookies = cookieParser();
    const nonce = cookies.nonce || '';
    
    // Add the nonce to Next.js data
    if (nonce) {
      ctx.renderPage = () => 
        originalProps.renderPage({
          enhanceApp: (App) => (props) => <App {...props} nonce={nonce} />,
          enhanceComponent: (Component) => Component
        });
    }
    
    // Return the props with the nonce
    return {
      ...originalProps,
      nonce
    };
  } catch (error) {
    console.error('Error getting nonce from cookies:', error);
    return originalProps;
  }
};

export default Document; 