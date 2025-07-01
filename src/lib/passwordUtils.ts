const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const HASH_LENGTH = 64;

export async function generateSalt(): Promise<string> {
    const salt = new Uint8Array(SALT_LENGTH);
    crypto.getRandomValues(salt);
    return Array.from(salt, (byte) => byte.toString(16).padStart(2, "0")).join(
        "",
    );
}

export async function hashPassword(
    password: string,
    salt: string,
): Promise<string> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = new Uint8Array(
        salt.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
    );

    const key = await crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        { name: "PBKDF2" },
        false,
        ["deriveBits"],
    );

    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: saltBuffer,
            iterations: PBKDF2_ITERATIONS,
            hash: "SHA-256",
        },
        key,
        HASH_LENGTH * 8,
    );

    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray, (byte) =>
        byte.toString(16).padStart(2, "0"),
    ).join("");
}

export async function verifyPassword(
    password: string,
    salt: string,
    hash: string,
): Promise<boolean> {
    const computedHash = await hashPassword(password, salt);
    return computedHash === hash;
}

export function isHashedPassword(password: string): boolean {
    return password.includes(":") && password.split(":").length === 2;
}

export async function createHashedPassword(password: string): Promise<string> {
    const salt = await generateSalt();
    const hash = await hashPassword(password, salt);
    return `${salt}:${hash}`;
}
