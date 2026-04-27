exports.filterField = (data, allowedFields) => {
  const filtered = {};
  Object.keys(data || {}).forEach((key) => {
    if (allowedFields.includes(key)) {
      filtered[key] = data[key];
    }
  });
  return filtered;
};
