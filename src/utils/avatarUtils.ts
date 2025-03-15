export const getRandomAvatar = (username: string) => {
    // Use consistent seed for each username
    const seed = username || 'anonymous';
    return `https://robohash.org/${seed}?set=set3&size=40x40`;
}; 