const isEmpty = (object): boolean => {
  return Object.keys(object).length === 0 || JSON.stringify(object) === "{}";
};

export { isEmpty };
