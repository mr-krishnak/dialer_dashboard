export async function getServerSideProps({ req }) {
    // Retrieve the user's IP address from the request object
    const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Pass the IP address as a prop to the component
    return {
        props: {
            ipAddress: ipAddress || "Unknown", // Default to 'Unknown' if IP address not found
        },
    };
}
