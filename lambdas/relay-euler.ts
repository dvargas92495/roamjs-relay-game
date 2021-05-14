import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";

const REGEX = /<div class="problem_content" role="problem">(.*?)<\/div>/;

export const handler: APIGatewayProxyHandler = (event) => {
  const id = event.queryStringParameters?.problem;
  return axios
    .get(`https://projecteuler.net/problem=${id}`, {
      headers: {
        "Content-type": "text/html",
      },
      responseType: "document",
    })
    .then((r) => {
      return {
        statusCode: 200,
        body: JSON.stringify({
          problem: REGEX.exec(r.data)?.[1],
        }),
        headers: {
          "Access-Control-Allow-Origin": "https://roamresearch.com",
          "Access-Control-Allow-Methods": "GET",
        },
      };
    });
};
