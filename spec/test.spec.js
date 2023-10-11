const http=require('http');
const {handleRequest, isContentTypeSupported,parseFormURLEncoded}=require('../main');

const serverPort=3001;
let server;

beforeAll((done) => {
    server = http.createServer(handleRequest);
    server.listen(serverPort, () => { 
      done();
    });
  });

afterAll((done)=>{
    server.close(()=>{
        done();
    });
});


function testRequest(path,contentType,data,expectedStatus,method,done,validate,expectedResponse){
    const options={
        hostname:'localhost',
        port:serverPort,
        path:path,
        method:method,
        headers:{
            'Content-Type':contentType,
            'Content-Length':Buffer.byteLength(data),
        },
    };
    const req=http.request(options,(res)=>{
        expect(res.statusCode).toBe(expectedStatus);
        if(expectedStatus===200){
            let responseData='';
            res.on('data',(chunk)=>{
                responseData+=chunk;
            });
            res.on('end',()=>{
                expect(responseData).toBe(data);
                if(validate){
                    validate(responseData,contentType,expectedResponse);
                }
                done();
            });
        }else{
            done();
        }
    });
    req.end(data);
}

function validateContent(data,contentType,expectedResponse){
    if(contentType==='text/plain'){
        expect(data).toBe(expectedResponse);
    }
    else if(contentType==='application/json'){
        const jsonData=JSON.parse(data);
        expect(jsonData).toEqual(expectedResponse);
    }
    else if(contentType==='application/xml'){
        expect(data).toBe(expectedResponse);
    }else{
        throw new Error(`Unsupported Content Type: ${contentType}`);
    }
}

describe('Message Bouncing Service',()=>{
    it('should return 404 for a GET with valid content type and valid message',(done)=>{
        testRequest('/echo','text/plain','Hello',404,'GET',done);
    });

    it('should return 404 for POST to an unknown route',(done)=>{
        testRequest('/unknown-route','text/plain','Hello',404,'POST',done);
    });

    it('should return 200 for a POST with valid content type and valid message(text/plain)',(done)=>{
        testRequest('/echo','text/plain','Hello',200,'POST',done);
    });

    it('should return 200 for a POST with valid content type and valid message(application/json)',(done)=>{
        testRequest('/echo','application/json',"{\"hello\":\"world\"}",200,'POST',done);
    });

    it('should return 200 for a POST with valid content type and valid message(application/x-www-form-urlencode)',(done)=>{
        testRequest('/echo','text/plain','MyVariableOne=ValueOne&MyVariableTwo=ValueTwo',200,'POST',done);
    });

    it('should return 415 for a POST with valid message but unsupported content type',(done)=>{
        testRequest('/echo','application/abc','Hello',415,'POST',done);
    });

    it('should return 415 for a POST with missing content type',(done)=>{
        testRequest('/echo','','Hello',415,'POST',done);
    });

    it('should return 400 for a POST with valid content type but invalid message',(done)=>{
        testRequest('/echo','application/json','Hello',400,'POST',done);
    });

    it('should return 400 for a POST with a valid content type but empty message',(done)=>{
        testRequest('/echo','text/plain','',400,'POST',done);
    });

    it('should handle a POST with a very large message without error',(done)=>{
        const message='x'.repeat(10*1024*1024);
        testRequest('/echo','text/plain',message,200,'POST',done);
    });

    it('should return 200 for valid text/plain message and the content must match',(done)=>{
        testRequest('/echo','text/plain','Hello',200,'POST',done,validateContent,'Hello');
    });

    it('should return 200 for valid application/json message and the content must match',(done)=>{
        const jsonData = { "Hello": "World" };
        testRequest('/echo','application/json','{"Hello":"World"}',200,'POST',done,validateContent,jsonData);
    })

    it('should return 200 for valid application/xml message and the content must match',(done)=>{
        const xmlData='<root><note>Hello</note></root>';
        testRequest('/echo','application/xml',xmlData,200,'POST',done,validateContent,xmlData);
    });
    
    it('should handle multiple concurrent requests without crashing',(done)=>{
        const numConcurrentRequests=10;
        const concurrentRequests=[];
        for(let i=0;i<numConcurrentRequests;i++){
            const data=`Request ${i}`;
            const path='/echo';
            const contentType='text/plain';
            const expectedResponse=data;;
            concurrentRequests.push(
                new Promise((resolve)=>{
                    testRequest(path,contentType,data,200,'POST',resolve,validateContent,expectedResponse);
                })
            );
        }
        Promise.all(concurrentRequests).then(()=>{
            done();
        });
    });

});
