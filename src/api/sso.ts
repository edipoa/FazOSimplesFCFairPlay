const COOKIE_NAME = 'fazosimples_token';
const COOKIE_DOMAIN = '.fazosimples.com';

export const ssoToken = {
    get(): string | null {
        const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
        return match?.[1] ? decodeURIComponent(match[1]) : null;
    },
    set(token: string, expiresInSeconds = 86400): void {
        const expires = new Date(Date.now() + expiresInSeconds * 1000).toUTCString();
        document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; domain=${COOKIE_DOMAIN}; path=/; secure; samesite=lax; expires=${expires}`;
    },
    clear(): void {
        document.cookie = `${COOKIE_NAME}=; domain=${COOKIE_DOMAIN}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    },
};
