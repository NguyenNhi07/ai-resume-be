export const SWAGGER_CUSTOM_JS = `
  const iid = setInterval(() => {
    const btn = document.querySelector("#swagger-ui > section > div.swagger-ui > div:nth-child(2) > div:nth-child(5) > section > section > h4 > button");
    if (btn) {
      btn.click();
      clearInterval(iid);
    }
  }, 200);
`;
