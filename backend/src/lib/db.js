const impl = process.env.PRODUCTS_TABLE ? await import('./db-aws.js') : await import('./db-local.js');

export const { listProducts, getProduct, putProduct, deleteProduct, adjustStock, listOrders, listOrdersByUser, getOrder, putOrder, updateOrder } = impl;
