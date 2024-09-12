# Project Overview

This project backend service that provides a GraphQL API for querying companies stock data. The application is built using NestJS, Typescript, TypeORM, and Apollo Server and tests are written using Jest.

# Installation

Pre-requisites

- [NodeJS](http://nodejs.org/) >= 22.0
- NPM 6 or Yarn.

Install the dependencies

```bash
$ yarn -g @nestjs/cli
$ yarn install # or npm install
```

### Run

Development server

```bash
$ yarn dev # or npm run dev
```

Production server

```bash
$ yarn build # or npm run build
$ yarn start # or npm run start
```

# Improvements

## Caching for Get Many Companies

To improve the performance of fetching multiple companies, caching can be implemented. By storing the results of frequently requested data in a cache (e.g., Redis), we can reduce the load on the database and speed up response times.

## Redundant Last Price Column

Adding a redundant column for the last price in the companies table can significantly improve the performance of queries that need the latest stock price. Instead of scanning the entire price table to find the last price, the application can directly retrieve it from the companies table.

## Pre-calculate and Cache Price Fluctuation

Since the price fluctuation is updated only once per day, it is more efficient to pre-calculate this value and store it in a cache. This approach avoids recalculating the fluctuation every time it is requested, thus improving the application's performance.
