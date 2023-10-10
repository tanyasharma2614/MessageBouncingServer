const http = require('http');
const xml2js = require('xml2js');


function handleRequest(req,res){
    if(req.method==='POST' && req.url==='/echo'){
        const contentType=req.headers['content-type'];

        if(!isContentTypeSupported(contentType)){
            res.writeHead(415,{'Content-Type':'text/plain'});
            res.end('Unsupported Content-Type. Supported types: text/plain, application/json,application/xml');
            return;
        }

        let rawData='';
        req.on('data',(chunk)=>{
            rawData+=chunk;
        });

        req.on('end',()=>{
            if(!rawData){
                res.writeHead(400,{'Content-Type':'text/plain'});
                res.end('Bad Request: Missing or empty request body');
                return;
            }
            let parsedBody;
            let responseText;
            try{
                switch(contentType){
                    case 'text/plain':
                        responseText=rawData;
                        break;
                    case 'application/json':
                        parsedBody=JSON.parse(rawData);
                        responseText=rawData;
                        break;
                    case 'application/xml':
                        parsedBody=parseXML(rawData);
                        responseText=rawData;
                        break;
                    default:
                        res.writeHead(415,{'Content-Type':'text/plain'});
                        res.end('Unsupported Content-Type. Supported types: text/plain, application/json,application/x-www-form-urlencoded');
                        return;
                    }
                    res.writeHead(200,{'Content-Type':contentType});
                    res.end(responseText);
            }catch(error){
                res.writeHead(400,{'Content-Type':'text/plain'});
                res.end(`Bad Request: Invalid message body format for Content-Type:${contentType}`);
            }
        });
    } else{
        res.writeHead(404,{'Content-Type':'text/plain'});
        res.end('Not Found');
    }
};

function isContentTypeSupported(contentType){
    const supportedTypes=['text/plain','application/json','application/xml'];
    return supportedTypes.includes(contentType);
}

function parseXML(xmlData){
    const builder=new xml2js.Builder();
    const xml=builder.buildObject(xmlData);
    return xml;
}
  

const server=http.createServer(handleRequest);
const port = 3000;
server.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});

module.exports={
    handleRequest,
    isContentTypeSupported,
};