const urlModel = require('../models/urlModel')
const {isValidRequest, isValidURL, isValidString} = require('../validator/validation')
const shortId = require('shortid')
const axios = require('axios')
const redis = require('redis')
const {promisify} = require('util')

//connecting redis 
const redisClient = redis.createClient(
    15437,
    "redis-15437.c212.ap-south-1-1.ec2.cloud.redislabs.com",
    {no_ready_check: true},
);
redisClient.auth("OIioxIVC8c1EflsNApUavYHUenEKpHIk", function(err){
    if (err) throw err;
});
redisClient.on("connect", async function(){
    console.log("connected to Redis")
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient)
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient)

//============================================================CREATE SHORT URL============================================================
const createURL = async function(req, res){
    try{
        if(!isValidRequest(req.body)){
            return res
            .status(400)
            .send({status: false, message: "Enter a valid Input"})
        }
        let {longUrl} = req.body
        let baseURL = "http://localhost:3000/"
        let Id = shortId.generate()
        let data = {}
        let shortUrl = ""
        
        if(!isValidString(longUrl)){
            return res
            .status(400)
            .send({status: false, message: "Enter a valid URL"})
        }

        if(!isValidURL(longUrl)){
            return res
            .status(400)
            .send({status: false, message: "Enter a valid URL"})
        }

        let urlFound = false

        let obj = {
            method: 'get',
            url: longUrl
        }
        await axios(obj).then((res)=>{
                            if(res.status==201 || res.status==200)
                            urlFound = true
                            }).catch((err)=>{})
                    
        if(urlFound == false){
            return res
                .status(400)
                .send({status: false, message: "Invalid URL"})
        }

            let cachedURL = await GET_ASYNC(`${longUrl}`)
            console.log(cachedURL)
            if(cachedURL){
                cachedURL = JSON.parse(cachedURL)
                return res.status(409).send({status: true, message: `${longUrl} this URL has already been shortened`, data: cachedURL})
            }else{
                const isDuplicate = await urlModel.findOne({longUrl:longUrl}).select({longUrl:1, shortUrl:1, urlCode:1, _id:0})
                if(isDuplicate){
                    return res
                        .status(409)
                        .send({status: true, message: `${longUrl} this URL has already been shortened`, data: isDuplicate})
                }
            }
                data.longUrl = longUrl
                shortUrl = baseURL + Id.toLocaleLowerCase()
                data.shortUrl = shortUrl
                data.urlCode = Id
                await urlModel.create(data)
                return res
                    .status(201)
                    .send({status: true, data: data})
                
            }
    catch(error){
        console.log(error.message)
        return res
                .status(500)
                .send({status: false, message: error.message})
    }
}

const getURL = async function(req, res){
    try{
        let urlCode = req.params.urlCode

        if(!shortId.isValid(urlCode)){
            return res
                .status(400)
                .send({status: false, message: "Enter a valid urlCode"})
        }
            //getting data from cache
            let cachedURL = await GET_ASYNC(urlCode)
            if(cachedURL){
                cachedURL = JSON.parse(cachedURL)
               return res.status(307).redirect(cachedURL.longUrl)
            }else{
                const urlData = await urlModel.findOne({urlCode:urlCode}).select({longUrl:1, shortUrl:1, urlCode:1, _id:0})
                if(!urlData){
                    return res
                        .status(404)
                        .send({status: false, message: "No URL exists for this code"})
                }
                let longUrl = urlData.longUrl

                //saving data in cache in key-value pair
                await SET_ASYNC(`${urlCode}`, JSON.stringify(urlData))
                await SET_ASYNC(`${longUrl}`, JSON.stringify(urlData))
                return  res
                    .status(307)
                    .redirect(longUrl)
            }
    }
       
    catch(error){
        return res
            .status(500)
            .send({status: false, message: error.message})
    }
}

module.exports = {createURL, getURL}
