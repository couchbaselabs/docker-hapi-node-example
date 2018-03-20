const Couchbase = require("couchbase");
const Hapi = require("hapi");
const Joi = require("joi");
const UUID = require("uuid");
const OS = require("os");

var server = new Hapi.Server({ host: OS.hostname(), port: "3000", routes: { "cors": true } });
var cluster, bucket;

var connect = (callback) => {
    if(bucket) {
        return callback();
    }
    cluster = new Couchbase.Cluster("couchbase://" + process.env.COUCHBASE_HOST);
    cluster.authenticate(process.env.COUCHBASE_APPLICATION_USER, process.env.COUCHBASE_APPLICATION_PASSWORD);
    bucket = cluster.openBucket(process.env.COUCHBASE_BUCKET, error => {
        if(error) {
            bucket = null;
            setTimeout(() => {
                connect(callback);
            }, 5000);
        } else {
            return callback();
        }
    });
}

server.route({
    method: "GET",
    path: "/",
    handler: (request, h) => {
        return "Hello Sacramento!";
    }
})

server.route({
    method: "POST",
    path: "/customer",
    options: {
        validate: {
            payload: {
                firstname: Joi.string().required(),
                lastname: Joi.string().required(),
                type: Joi.string().forbidden().default("customer")
            }
        }
    },
    handler: async (request, h) => {
        var id = UUID.v4();
        return await new Promise((resolve, reject) => {
            bucket.insert(id, request.payload, (error, result) => {
                if(error) {
                    reject(h.response({ code: error.code, message: error.message }).code(500));
                }
                request.payload.id = id;
                resolve(h.response(request.payload));
            });
        });
    }
});

server.route({
    method: "PUT",
    path: "/customer/creditcard/{id}",
    options: {
        validate: {
            params: {
                id: Joi.string().required()
            },
            payload: {
                provider: Joi.string().required(),
                number: Joi.string().required(),
                expiration: Joi.string().required()
            }
        }
    },
    handler: async (request, h) => {
        return await new Promise((resolve, reject) => {
            bucket.mutateIn(request.params.id).arrayAppend("creditcards", request.payload, true).execute((error, result) => {
                if(error) {
                    reject(h.response({ code: error.code, message: error.message }).code(500));
                }
                resolve(h.response(request.payload));
            });
        });
    }
})

server.route({
    method: "GET",
    path: "/customer/{id}",
    options: {
        validate: {
            params: {
                id: Joi.string().required()
            }
        }
    },
    handler: async (request, h) => {
        return await new Promise((resolve, reject) => {
            bucket.get(request.params.id, (error, result) => {
                if(error) {
                    reject(h.response({ code: error.code, message: error.message }).code(500));
                }
                result.value.id = request.params.id;
                resolve(h.response(result.value));
            });
        });
    }
});

server.route({
    method: "GET",
    path: "/customer/creditcards/{id}",
    options: {
        validate: {
            params: {
                id: Joi.string().required()
            }
        }
    },
    handler: async (request, h) => {
        return await new Promise((resolve, reject) => {
            bucket.lookupIn(request.params.id).get("creditcards").execute((error, result) => {
                if(error) {
                    reject(h.response({ code: error.code, message: error.message }).code(500));
                }
                resolve(h.response(result.content("creditcards")));
            });
        });
    }
})

server.route({
    method: "GET",
    path: "/customers",
    handler: async (request, h) => {
        return await new Promise((resolve, reject) => {
            var statement = "SELECT META(customer).id, customer.* FROM " + bucket._name + " AS customer WHERE customer.type = 'customer'";
            var query = Couchbase.N1qlQuery.fromString(statement);
            bucket.query(query, (error, result) => {
                if(error) {
                    reject(h.response({ code: error.code, message: error.message }).code(500));
                }
                resolve(h.response(result));
            });
        });
    }
});

server.route({
    method: "POST",
    path: "/product",
    options: {
        validate: {
            payload: {
                name: Joi.string().required(),
                price: Joi.number().required(),
                type: Joi.string().forbidden().default("product")
            }
        }
    },
    handler: async (request, h) => {
        var id = UUID.v4();
        return await new Promise((resolve, reject) => {
            bucket.insert(id, request.payload, (error, result) => {
                if(error) {
                    reject(h.response({ code: error.code, message: error.message }).code(500));
                }
                request.payload.id = id;
                resolve(h.response(request.payload));
            });
        });
    }
});

server.route({
    method: "GET",
    path: "/product/{id}",
    options: {
        validate: {
            params: {
                id: Joi.string().required()
            }
        }
    },
    handler: async (request, h) => {
        return await new Promise((resolve, reject) => {
            bucket.get(request.params.id, (error, result) => {
                if(error) {
                    reject(h.response({ code: error.code, message: error.message }).code(500));
                }
                result.value.id = request.params.id;
                resolve(h.response(result.value));
            });
        });
    }
});

server.route({
    method: "GET",
    path: "/products",
    handler: async (request, h) => {
        return await new Promise((resolve, reject) => {
            var statement = "SELECT META(product).id, product.* FROM " + bucket._name + " AS product WHERE product.type = 'product'";
            var query = Couchbase.N1qlQuery.fromString(statement);
            bucket.query(query, (error, result) => {
                if(error) {
                    reject(h.response({ code: error.code, message: error.message }).code(500));
                }
                resolve(h.response(result));
            });
        });
    }
});

server.route({
    method: "POST",
    path: "/receipt",
    options: {
        validate: {
            payload: {
                customerid: Joi.string().required(),
                productids: Joi.array().min(1).items(Joi.string()),
                type: Joi.string().forbidden().default("receipt")
            }
        }
    },
    handler: async (request, h) => {
        return await new Promise((resolve, reject) => {
            var statement = `
                SELECT
                    (SELECT META(c).id, c.* FROM ` + bucket._name + ` AS c USE KEYS $customerid)[0] AS customer,
                    (SELECT META(p).id, p.* FROM ` + bucket._name + ` AS p USE KEYS $productids) AS products
            `;
            var query = Couchbase.N1qlQuery.fromString(statement);
            bucket.query(query, { customerid: request.payload.customerid, productids: request.payload.productids }, (error, snapshot) => {
                if(error) {
                    reject(h.response({ code: error.code, message: error.message }).code(500));
                }
                var id = UUID.v4();
                snapshot[0].type = request.payload.type;
                bucket.insert(id, snapshot[0], (error, result) => {
                    if(error) {
                        reject(h.response({ code: error.code, message: error.message }).code(500));
                    }
                    snapshot.id = id;
                    resolve(h.response(snapshot[0]));
                });
            });
        });
    }
});

server.route({
    method: "GET",
    path: "/receipts",
    handler: async (request, h) => {
        return await new Promise((resolve, reject) => {
            var statement = "SELECT META(receipt).id, receipt.* FROM " + bucket._name + " AS receipt WHERE receipt.type = 'receipts'";
            var query = Couchbase.N1qlQuery.fromString(statement);
            bucket.query(query, (error, result) => {
                if(error) {
                    reject(h.response({ code: error.code, message: error.message }).code(500));
                }
                resolve(h.response(result));
            });
        });
    }
});

server.start().then(result => {
    connect(() => {
        var statement = "CREATE PRIMARY INDEX ON " + bucket._name;
        var query = Couchbase.N1qlQuery.fromString(statement);
        bucket.query(query, (error, result) => {
            console.log("Listening at " + server.info.uri);
        });
    });
});
