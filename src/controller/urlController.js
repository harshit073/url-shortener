const urlModel = require('../models/urlModel')
const {isValidRequest, isValidURL, isValid} = require('../validator/validation')
const shortId = require('shortid')
const axios = require('axios')


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
        
        if(!isValid(longUrl)){
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

        const isDuplicate = await urlModel.findOne({longUrl: longUrl}).select({_id:0, __v:0})
        if(isDuplicate){
            return res
                .status(200)
                .send({status: true, message: ` ${longUrl} this URL has already been shortened`, data: isDuplicate })
        }

        data.longUrl = longUrl
        shortUrl = baseURL + Id.toLocaleLowerCase()
        data.shortUrl = shortUrl
        data.urlCode = Id

        const createShortURL = await urlModel.create(data)
        
        return res
            .status(201)
            .send({status: true, data: data})
       
    }
    catch(error){
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

        const url = await urlModel.findOne({urlCode:urlCode})
        if(!url){
            return res
                .status(404)
                .send({status: false, message: "No URL exists for this code"})
        }
        let longUrl = url.longUrl
        return  res
            .status(302)
            // .send(`Redirecting to ${longUrl}`)
            .redirect(longUrl)
    }
    catch(error){
        return res
            .status(500)
            .send({status: false, message: error.message})
    }
}

module.exports = {createURL, getURL}
