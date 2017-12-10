import { Types } from 'mongoose';

const stripe = require('stripe')(process.env.STRIPE_API_KEY);

interface ICustomer {
    _id: Types.ObjectId;
    email: string;
    name: string;
}

export class CustomerService {
    /**
     * Fetch a customers details
     * https://stripe.com/docs/api#retrieve_customer
     */
    static async get(customerId: string) {
        return await stripe.customers.retrieve(customerId, { api_key: process.env.STRIPE_API_KEY });
    }

    /**
     * Create a new customer
     * https://stripe.com/docs/api#create_customer
     */
    static async create(data: ICustomer) {
        return await stripe.customers.create({
            email: data.email,
            metadata: {
                _id: data._id.toString(),
                name: data.name
            }
        }, { api_key: process.env.STRIPE_API_KEY });
    }

    /**
     * Update a customer
     * https://stripe.com/docs/api#update_customer
     */
    static async update(customerId: string, data: any) {
        return await stripe.customers.update(customerId, data, { api_key: process.env.STRIPE_API_KEY });
    }

    /**
     * Delete a customer
     * https://stripe.com/docs/api#delete_customer
     */
    static async delete(customerId: string) {
        return await stripe.customers.del(customerId, { api_key: process.env.STRIPE_API_KEY });
    }

    /**
     * List customers
     * https://stripe.com/docs/api#list_customers
     * - { limit: Number, starting_after: string }
     */
    static async list(options: any) {
        return await stripe.customers.list(options, { api_key: process.env.STRIPE_API_KEY });
    }
}
