'use strict';
var ConnectRuntime = require('./Bindings/njs/opn.js');  /*import Comfort api*/
const nodemailer = require('nodemailer');  /* Node Js Module*/
const fs = require('fs');
const path = require('path');
//const smptOptions = JSON.parse(fs.readFileSync(path.normalize(path.join('.', 'mailsiemensoptions.json'))).toString());
//if (!smptOptions.proxy) { // take proxy from env when it is not set in options
//	smptOptions.proxy =  process.env.http_proxy;
//}

// used to collect the tag values needed within the email
var tagsReadCompleted = []; // Array to store read tags received from runtime
var tagsToRead = [];   //  Array to store to be read tags
tagsToRead.push("edgewsFromAddress");
tagsToRead.push("edgewsToAddress");
tagsToRead.push("edgewsSubject");
tagsToRead.push("edgewsSMTPHost");
tagsToRead.push("edgeintSMTPPort");
tagsToRead.push("edgewsSMTPUser");
tagsToRead.push("edgeboSMTPSecure");
tagsToRead.push("edgewsSMTPHostPassword");
tagsToRead.push("edgewsAttachmentPath");
tagsToRead.push("edgewsEmailText")

var smptOptions = [];



/* Connect To runtime with OpenPipe API*/
ConnectRuntime.Connect((runtimeClass) => {
	let runtime = runtimeClass.Runtime;
	runtime.on('NotifySubscribeTag',(tagsList, cookie) => {
		
		for (let tagobject of tagsList) {
			if (tagobject.Name == 'edgeboTriggerTag') {
				runtime.ReadTag(tagsToRead, "ReadTagCookie");
			}
		}
		
	});
	runtime.on('NotifyReadTag',(tagsList, cookie)  => {				
				SendEmailHandler(tagsList);							
	});
	/* Subscribe Tag*/
	runtime.SubscribeTag(['edgeboTriggerTag'],"SubscribeTagCookie");
});



/*Send Email function*/
function SendEmailHandler(tagsList)
{
	/* Since this sample is written with 'SetOption EnableExpertMode' via comfort layer, 
	then response will be always in JSON mode */
	if (tagsList) 
	{	
			
		for (let tagData of tagsList) {
		//Preparing email text
		//emailText += 'Tag '+tagData.Name+'= '+tagData.Value+'\n';
		
		tagsReadCompleted.push(tagData.Name);
			if(tagData.Name === 'edgewsSubject')
			{
				var edgewsSubject = tagData.Value;
				console.log("Subject" + edgewsSubject);
			}
			if(tagData.Name ==='edgewsFromAddress'){
				var edgewsFromAddress = tagData.Value;
				console.log("From: " + edgewsFromAddress)
			}
			if(tagData.Name ==='edgewsToAddress'){
				var edgewsToAddress = tagData.Value;
				console.log("To: " + edgewsToAddress)
			}
			if(tagData.Name === 'edgewsSMTPHost')
			{
				var edgewsSMTPHost = tagData.Value;
				console.log("SMTTPHost: " + edgewsSMTPHost);
			}
			if(tagData.Name ==='edgeintSMTPPort'){
				var edgeintSMTPPort = tagData.Value;
				console.log("SMTPPort: " + edgeintSMTPPort);
			}
			if(tagData.Name ==='edgeboSMTPSecure'){
				console.log("SMTPSecure: " + tagData.Value)
				if(tagData.Value===1 || tagData.Value ==='TRUE'){
				var edgeboSMTPSecure = true;
			}
				else{
				var SMTPSecure = false
				}
				console.log("SMTPSecure: " + edgeboSMTPSecure)
			}
			if(tagData.Name ==='edgeboSMTPrequireTLS'){
				console.log("SMTPrequireTLS: " + tagData.Value)
				if(tagData.Value===1 || tagData.Value ==='TRUE'){
				var edgeboSMTPrequireTLS = true;
			}
				else{
				var SMTPrequireTLS = false
				}
				console.log("SMTPrequireTLS: " + edgeboSMTPrequireTLS)
			}
			if(tagData.Name ==='edgewsSMTPUser'){
				var edgewsSMTPUser = tagData.Value;
				console.log("SMTPUser: " + edgewsSMTPUser)
			}
			if(tagData.Name ==='edgewsSMTPHostPassword'){
				var edgewsSMTPHostPassword = tagData.Value;
				console.log("SMTPHostPassword: **********")
			}
			if(tagData.Name ==='edgewsAttachmentPath'){
				var edgewsAttachmentPath = tagData.Value;
				console.log("AttachmentPath: " + edgewsAttachmentPath)
			}
			if(tagData.Name ==='edgewsEmailText'){
				var edgewsEmailText = tagData.Value;
				console.log("AttachmentPath: " + edgewsEmailText)
			}
			
		}

		/*Define Parameters for SMTP Connection */
		smptOptions = {
			host: edgewsSMTPHost ,
			port: edgeintSMTPPort,
			secure: edgeboSMTPSecure,
			tls: {
				rejectUnauthorized: false
			},
			requireTLS : edgeboSMTPrequireTLS,
			auth: {
				user: edgewsSMTPUser,
				pass: edgewsSMTPHostPassword
			}			
		}	

		/*Check whether all tags read or not, if read send e-mail*/
		if(compare(tagsReadCompleted,tagsToRead))
		{
			console.log("Emailtext : "+ edgewsEmailText);
			tagsReadCompleted = [];
		
			let params = {
				from: edgewsFromAddress,
				to: edgewsToAddress,
				subject: edgewsSubject,
				body: edgewsEmailText				
			};

			let attachment = [						
				{   // use URL as an attachment					
					path: edgewsAttachmentPath
				}
			]
			
			if( edgewsAttachmentPath.length >1 && fs.existsSync(edgewsAttachmentPath)){
				if( fs.statSync(edgewsAttachmentPath).size < 20000000){
					params['attachments'] = attachment;	}
			}
			else{
				console.log("No Attachment or file to large")
			}
			sendEmail(params).then((error) => {
				console.log(`Send Email succeeded`);
				
				
			}).catch((error) => {
				console.log(`Send Email failed, error ${error}`);
				
			});
			edgewsEmailText = "";
		}

		// ****************************************************************************
	}
		
}
// async function, returns Promise
function sendEmail(params) {
    return new Promise(function (resolve, reject) {
        let transporter = nodemailer.createTransport(smptOptions);
		transporter.sendMail({ from: params.from, to: params.to, subject: params.subject, 
				text: params.body,attachments: params.attachments },
            function (err) {
                if (err) {
                    console.log(`send: err = ${err}`);
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

/*Array Compare function*/
function compare(a, b) {
	a.sort();
	b.sort();
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length != b.length) return false;

	for (var i = 0; i < a.length; ++i) {
	if (a[i] !== b[i]) return false;
	}
	return true;
}
