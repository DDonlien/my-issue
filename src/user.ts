import os from 'node:os';

export function currentUsername() { return os.userInfo().username; }
