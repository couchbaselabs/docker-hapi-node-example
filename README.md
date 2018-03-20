# Couchbase with Docker and Hapi.js for Node.js Example

An example application designed to demonstrate deployment of a Hapi.js RESTful API and Couchbase Server as Docker containers.

## Deploying with Docker

To deploy Couchbase as well as the Node.js application as Docker containers, execute the following commands:

```
git clone https://github.com/couchbaselabs/docker-hapi-node-example
cd docker-hapi-node-example
docker-compose up -d
```

The above commands will clone the project and start the services defined in the Compose file for Docker.

The Couchbase Dashboard can be accessed at http://localhost:8091 while the RESTful API can be accessed at http://localhost:3000.

## API Documentation

**POST /customer**

```
request_body: {
    "firstname": string,
    "lastname": string
}

response: {
    "id": string,
    "type": string,
    "firstname": string,
    "lastname": string
}
```

**PUT /customer/creditcard/{id}**

```
request_params: {
    "id": string
}

request_body: {
    "provider": string,
    "number": string,
    "expiration": string
}

response: {
    "provider": string,
    "number": string,
    "expiration": string
}
```

**GET /customer/creditcards/{id}**

```
request_params: {
    "id": string
}

response: [
    {
        "provider": string,
        "number": string,
        "expiration": string
    }
]
```

**GET /customer/{id}**

```
request_params: {
    "id": string
}

response: {
    "id": string,
    "type": string,
    "firstname": string,
    "lastname": string
}
```

**GET /customers**

```
response: [
    {
        "id": string,
        "type": string,
        "firstname": string,
        "lastname": string
    }
]
```

**POST /product**

```
request_body: {
    "name": string,
    "price": number
}

response: {
    "id": string,
    "type": string,
    "name": string,
    "price": number
}
```

**GET /product/{id}**

```
request_params: {
    "id": string
}

response: {
    "id": string,
    "type": string,
    "name": string,
    "price": number
}
```

**GET /products**

```
response: [
    {
        "id": string,
        "type": string,
        "name": string,
        "price": number
    }
]
```

**POST /receipt**

```
request_body: {
    "customerid": string,
    "productids": array<string>
}

response: {
    "id": string,
    "type": string,
    "customer": object{
        "id": string,
        "type": string,
        "firstname": string,
        "lastname": string,
    },
    "products": array[
        object{
            "id": string,
            "type": string,
            "name": string,
            "price": number
        }
    ]
}
```

## Resources

If you'd like to reach out to me (Nic Raboy) directly, you can find me on Twitter at [@nraboy](https://www.twitter.com/nraboy), or you can check out the following resources for this project.

[Couchbase Developer Portal](https://developer.couchbase.com)

[Hapi.js](https://hapijs.com)

[Docker](https://www.docker.com)
