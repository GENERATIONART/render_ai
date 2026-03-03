const readApiError = async (res) => {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return data?.error ? String(data.error) : JSON.stringify(data);
    }
    const text = await res.text();
    return text ? String(text).slice(0, 300) : '';
  } catch {
    return '';
  }
};

export default readApiError;
