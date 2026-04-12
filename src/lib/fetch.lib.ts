export const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 3_000,
): Promise<Response> => {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= 0) throw err;
    console.log(`Retrying in ${delay / 1000}s... (remaining: ${retries})`);
    await new Promise((r) => setTimeout(r, delay));
    return fetchWithRetry(url, options, retries - 1, delay);
  }
};
