const express = require('express');
const { Telegraf, Markup } = require('telegraf');
const path = require('path'); 

const BOT_TOKEN = '7975724182:AAFG32toGVhdT3fSi_D2z2nzeTw-qnvKXNM';
CHAT_ID=672219639;

const app = express();
const bot = new Telegraf(BOT_TOKEN);

app.use(express.json());

app.post(`/webhook`, (req, res) => {
    bot.handleUpdate(req.body); 
    res.status(200).send('OK'); 
});

const WEBHOOK_URL = `https://telegramBot.onrender.com/webhook`; 
bot.telegram.setWebhook(WEBHOOK_URL);

const ensureSession = (ctx) => {
    if (!ctx.session) {
        ctx.session = {};
    }
};

const backToMenuMarkup = () => {
    return Markup.inlineKeyboard([
        [Markup.button.callback('Back to Menu', 'back_to_menu')],
        [Markup.button.url('Visit Our Website', 'https://niadevelopers.site')] 
    ]);
};

bot.start((ctx) => {
    ctx.reply('Welcome to NIADEVELOPERS BOT DEMO! To begin, please select an option:',
        Markup.inlineKeyboard([
            [Markup.button.callback('View Products', 'view_products')],
            [Markup.button.callback('View Services', 'view_services')],
            [Markup.button.callback('Enter Product Code', 'enter_product_code')],
            [Markup.button.callback('Enter Service Code', 'enter_service_code')],
            [Markup.button.callback('Contact Support', 'contact_support')],
            [Markup.button.url('Visit Our Website', 'https:niadevelopers.site')], // Another button for external website
            [Markup.button.url('Donate to Us 😎', 'https://Ko-fi.com/niadevelopers')]
        ])
    );
});

bot.action('view_products', async (ctx) => {
    ensureSession(ctx);
    ctx.reply('Here are our available products:', backToMenuMarkup());

    const products = [
        {
            name: "Product A",
            price: "\Ksh10",
            code: "PRODUCT123",
            imagePath: path.join(__dirname, 'assets', 'product-a.jpg'),
        },
        {
            name: "Product B",
            price: "\Ksh20",
            code: "PRODUCT456",
            imagePath: path.join(__dirname, 'assets', 'product-b.jpg'),
        },
        {
            name: "Product C",
            price: "\Ksh30",
            code: "PRODUCT789",
            imagePath: path.join(__dirname, 'assets', 'product-c.jpg'),
        }
    ];

    for (const product of products) {
        await ctx.replyWithPhoto({ source: product.imagePath }, {
            caption: `${product.name} - Code: ${product.code}\nPrice: ${product.price}`,
            reply_markup: Markup.inlineKeyboard([
                [Markup.button.callback('Select Product', `select_product:${product.code}`)],
                [Markup.button.callback('Back to Menu', 'back_to_menu')]
            ])
        });
    }
});


bot.action('view_services', async (ctx) => {
    ensureSession(ctx);
    ctx.reply('Here are our available services:', backToMenuMarkup());

    const services = [
        {
            name: "Service A",
            price: "\Ksh50",
            code: "SERVICE123",
            imagePath: path.join(__dirname, 'assets', 'service-a.jpg'),
        },
        {
            name: "Service B",
            price: "\Ksh100",
            code: "SERVICE456",
            imagePath: path.join(__dirname, 'assets', 'service-b.jpg'),
        },
        {
            name: "Service C",
            price: "\Ksh150",
            code: "SERVICE789",
            imagePath: path.join(__dirname, 'assets', 'service-c.jpg'),
        }
    ];

    for (const service of services) {
        await ctx.replyWithPhoto({ source: service.imagePath }, {
            caption: `${service.name} - Code: ${service.code}\nPrice: ${service.price}`,
            reply_markup: Markup.inlineKeyboard([
                [Markup.button.callback('Select Service', `select_service:${service.code}`)],
                [Markup.button.callback('Back to Menu', 'back_to_menu')]
            ])
        });
    }
});


bot.action('enter_product_code', (ctx) => {
    ensureSession(ctx);
    ctx.session.step = 'enter_product_code'; 
    ctx.reply('Please enter a product code you want to validate:', backToMenuMarkup());
});


bot.action('enter_service_code', (ctx) => {
    ensureSession(ctx);
    ctx.session.step = 'enter_service_code'; 
    ctx.reply('Please enter a service code you want to validate:', backToMenuMarkup());
});


bot.action(/select_product:(.+)/, (ctx) => {
    const productCode = ctx.match[1]; 
    ensureSession(ctx);
    ctx.session.selectedProductCode = productCode;

    const productDetails = findProductByCode(productCode);
    if (productDetails) {
        ctx.reply(`You selected ${productDetails.name}. The price is ${productDetails.price}. Please type the product code to confirm your selection.`,
            backToMenuMarkup()
        );
    } else {
        ctx.reply('Product not found. Please choose a product again.', backToMenuMarkup());
    }
});


bot.action(/select_service:(.+)/, (ctx) => {
    const serviceCode = ctx.match[1]; 
    ensureSession(ctx);
    ctx.session.selectedServiceCode = serviceCode;

    const serviceDetails = findServiceByCode(serviceCode);
    if (serviceDetails) {
        ctx.reply(`You selected ${serviceDetails.name}. The price is ${serviceDetails.price}. Please type the service code to confirm your selection.`,
            backToMenuMarkup()
        );
    } else {
        ctx.reply('Service not found. Please choose a service again.', backToMenuMarkup());
    }
});

//
bot.on('text', async (ctx) => {
    ensureSession(ctx);
    const enteredCode = ctx.message.text.trim();

    if (ctx.session.step === 'enter_product_code') {
        const productDetails = findProductByCode(enteredCode);
        if (productDetails) {
            ctx.session.selectedProductCode = enteredCode;
            ctx.reply(`Product confirmed: ${productDetails.name}\nTotal Amount: ${productDetails.price}\nPlease enter your delivery address:`,
                backToMenuMarkup()
            );
            ctx.session.step = 'address_entry'; 
            ctx.session.productPrice = productDetails.price; 
        } else {
            ctx.reply('Invalid product code. Please enter a valid product code.', backToMenuMarkup());
        }
    } else if (ctx.session.step === 'enter_service_code') {
        const serviceDetails = findServiceByCode(enteredCode);
        if (serviceDetails) {
            ctx.session.selectedServiceCode = enteredCode;
            ctx.reply(`Service confirmed: ${serviceDetails.name}\nTotal Amount: ${serviceDetails.price}\nPlease enter your personal details (e.g., full name, email):`,
                backToMenuMarkup()
            );
            ctx.session.step = 'personal_details_entry'; 
            ctx.session.servicePrice = serviceDetails.price; 
        } else {
            ctx.reply('Invalid service code. Please enter a valid service code.', backToMenuMarkup());
        }
    } else if (ctx.session.step === 'address_entry') {
        ctx.session.address = enteredCode; 
        ctx.session.step = 'payment_method_entry'; 
        ctx.reply(`Address saved: ${enteredCode}\nStep 2: How would you like to pay for the product (e.g., Mpesa, PayPal, Credit Card):`, backToMenuMarkup());
    } else if (ctx.session.step === 'personal_details_entry') {
        ctx.session.userDetails = enteredCode;
        ctx.session.step = 'payment_method_entry'; 
        ctx.reply(`Personal details saved: ${enteredCode}\nStep 2: How would you like to pay for the product (e.g., Mpesa, PayPal, Credit Card):`, backToMenuMarkup());
    } else if (ctx.session.step === 'payment_method_entry') {
        ctx.session.paymentMethod = enteredCode; 
        let totalAmount = ctx.session.productPrice || ctx.session.servicePrice;
        ctx.session.step = 'payment_confirmation'; 
        ctx.reply(`Payment method saved: ${enteredCode}\n Please make the payment of ${totalAmount} to the following details: [Payment Information].\nOnce you have paid, type "done" to confirm your payment.`, backToMenuMarkup());
    } else if (ctx.session.step === 'payment_confirmation' && enteredCode.toLowerCase() === 'done') {
        ctx.reply(`Thank you for your payment! Your ${ctx.session.selectedProductCode ? "product" : "service"} will be shipped shortly in your prefered destination,you can contact support for further assistance.`, 
            backToMenuMarkup()
        );
        ctx.session = null; 
    }
});


const findProductByCode = (code) => {
    const products = [
        {
            name: "Product A",
            price: "\Ksh10",
            code: "PRODUCT123",
            imagePath: path.join(__dirname, 'assets', 'product-a.jpg'),
        },
        {
            name: "Product B",
            price: "\Ksh20",
            code: "PRODUCT456",
            imagePath: path.join(__dirname, 'assets', 'product-b.jpg'),
        },
        {
            name: "Product C",
            price: "\Ksh30",
            code: "PRODUCT789",
            imagePath: path.join(__dirname, 'assets', 'product-c.jpg'),
        }
    ];
    return products.find(product => product.code === code);
};


const findServiceByCode = (code) => {
    const services = [
        {
            name: "Service A",
            price: "\Ksh50",
            code: "SERVICE123",
            imagePath: path.join(__dirname, 'assets', 'service-a.jpg'),
        },
        {
            name: "Service B",
            price: "\Ksh100",
            code: "SERVICE456",
            imagePath: path.join(__dirname, 'assets', 'service-b.jpg'),
        },
        {
            name: "Service C",
            price: "\Ksh150",
            code: "SERVICE789",
            imagePath: path.join(__dirname, 'assets', 'service-c.jpg'),
        }
    ];
    return services.find(service => service.code === code);
};


bot.action('back_to_menu', (ctx) => {
    ctx.reply('Please select an option:',
        Markup.inlineKeyboard([
            [Markup.button.callback('View Products', 'view_products')],
            [Markup.button.callback('View Services', 'view_services')],
            [Markup.button.callback('Enter Product Code', 'enter_product_code')],
            [Markup.button.callback('Enter Service Code', 'enter_service_code')],
            [Markup.button.callback('Contact Support', 'contact_support')],
            [Markup.button.url('Visit Our Website', 'https://niadevelopers.site')],
            [Markup.button.url('Donate to Us 😎', 'https://Ko-fi.com/niadevelopers')]  
        ])
    );
});


bot.action('contact_support', (ctx) => {
    ctx.reply('For any assistance, please contact our support team at nia.team.developers@gmail.com or call 0115704063.',
        Markup.inlineKeyboard([
            [Markup.button.callback('Back to Menu', 'back_to_menu')] 
        ])
    );
});


const PORT =3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

