export const isValidIP = (ip: string): boolean => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

export const isValidPort = (port: string | number): boolean => {
  const portNum = typeof port === 'string' ? parseInt(port) : port;
  return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
};

export const detectProtocol = (text: string): 'http' | 'https' => {
  return text.toLowerCase().includes('https') ? 'https' : 'http';
};

export const cleanText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ');
}; 