document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector("#compose-form").addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#compose-body').innerHTML = '';

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show inbox emails
  if (mailbox === 'inbox') {
    const inboxTable = document.createElement('table');
    inboxTable.className = "table table-hover";
    tbdy = document.createElement('tbody');
    inboxTable.append(tbdy)

    fetch('/emails/inbox')
    .then(response => response.json())
    .then(emails => {
      emails.forEach(function(email){
        tbdy.innerHTML += `
          <tr class="table-light" id="${email.id}">
              <td class="inboxmsg" onclick="view_email(${email.id})">${email.sender}</td>
              <td class="inboxmsg" onclick="view_email(${email.id})">${email.subject}</td>
              <td class="inboxmsg" onclick="view_email(${email.id})">${email.timestamp}</td>
              <td class="archive" onclick="archive(${email.id})"><i class="fa fa-archive" aria-hidden="true"></i></td>
          </tr>`;
          if (email.read == true){
            document.getElementById(`${email.id}`).className = 'table-secondary';
          }
      });
    });
    document.querySelector('#emails-view').append(inboxTable);
    
  // Show sent emails
  } else if (mailbox === 'sent') {
    const sentTable = document.createElement('table');
    sentTable.className = "table table-hover"
    tbdy = document.createElement('tbody');
    sentTable.append(tbdy)
    fetch('emails/sent')
    .then(response => response.json())
    .then(emails =>{
      emails.forEach(email => {
        tbdy.innerHTML += `
          <tr>
            <td class="sentmsg" onclick="view_email(${email.id})">${email.recipients}</td>
            <td class="sentmsg" onclick="view_email(${email.id})">${email.subject}</td>
            <td class="sentmsg" onclick="view_email(${email.id})">${email.timestamp}</td>
          </tr>`;
      });
    });
    document.querySelector('#emails-view').append(sentTable);

  // Show archived emails
  } else if (mailbox === 'archive') {
    const archiveTable = document.createElement('table');
    archiveTable.className = "table table-hover"
    tbdy = document.createElement('tbody');
    archiveTable.append(tbdy)
    fetch('emails/archive')
    .then(response => response.json())
    .then(emails =>{
      emails.forEach(email => {
        tbdy.innerHTML += `
          <tr>
            <td class="archmsg" onclick="view_email(${email.id})">${email.recipients}</td>
            <td class="archmsg" onclick="view_email(${email.id})">${email.subject}</td>
            <td class="archmsg" onclick="view_email(${email.id})">${email.timestamp}</td>
            <td class="unarchive" onclick="unarchive(${email.id})">Unarchive</td>
          </tr>`;
      });
    });
    document.querySelector('#emails-view').append(archiveTable);
  }
}

function send_email(event) {
  event.preventDefault();

  const recipients = document.getElementById('compose-recipients').value;
  const subject = document.getElementById('compose-subject').value;
  const body = document.getElementById('compose-body').innerHTML;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
    })
  })
  .then(response => response.json())
  .then(alert_text => {
    load_mailbox('sent')
    alert = document.querySelector("#message");
    alert.innerHTML = `
    <div class="alert alert-info alert-dismissible fade show" role="alert">
      ${alert_text.message}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span>
      </button>
    </div>`
  })
}

function view_email(email_id) {
  // Show email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    read_email(email.id)
    const msg = document.createElement('div');
    msg.innerHTML = `
    <h3 id="subject">${email.subject}</h3>
    <div id="btns" class="flex-container">
      <div><button type="button" class="btn btn-sm btn-outline-info" onclick="reply()">Reply</button></div>
    </div>
    <hr>
      <div class="row">
        <div class="col">From: <span id="sender">${email.sender}</span></div>
        <div id="timestamp" class="col"><span><strong>${email.timestamp}</strong></span></div>
      </div>
      <hr>
      <div class="row">
        <div class="col">To: <span id="receiver">${email.recipients}</span></div>
      </div>
      <hr>
      <div class="row">
        <div class="col"><section id="body">${email.body}</section></div>
      </div>
      <hr>`;
    document.querySelector('#email-view').innerHTML = '';
    document.querySelector('#email-view').append(msg);
    if (email['archived']){
      btns = document.getElementById("btns")
      btn = document.createElement("div")
      btn.innerHTML = `<button type="button" class="btn btn-sm btn-outline-info" onclick="unarchive(${email_id})">Unarchive</button>`
      btns.append(btn)
    } else if (email['read'] && document.querySelector("#user-email").innerHTML !== email["sender"]){
        btns = document.getElementById("btns")
        btn = document.createElement("div")
        btn.innerHTML = `<button type="button" class="btn btn-sm btn-outline-info" onclick="archive(${email_id})">Archive</button>`
        btns.append(btn)
    }
  });
}

function archive(email_id){
  fetch(`emails/${email_id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: true
    })
  });
  location.reload();
}

function unarchive(email_id) {
  fetch(`emails/${email_id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: false
    })
  });
  location.reload();
}

function read_email(email_id) {
  fetch(`emails/${email_id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true
    })
  });
}

function reply() {
  compose_email()
  const current_user = document.getElementById("user-email").innerHTML;
  const sender = document.getElementById('sender').innerHTML;
  const receiver = document.getElementById('receiver').innerHTML;
  let subject = document.getElementById('subject').innerHTML;
  const sender_text = document.getElementById('body').innerHTML;
  const timestamp = document.getElementById('timestamp').innerHTML;
  const body = document.createElement('div')
  body.innerHTML = `
  <br>
  <p>___</p>
  <p><i><b>On ${timestamp} ${sender} wrote: </b></i></p>
  <p><i>${sender_text}</i></p>`

  let string = "Re: "
  if (!subject.includes(string, 0)){
    string += subject;
    subject = string;
  };

  // Prefill composition fields
  if (current_user == sender) {
    document.querySelector('#compose-recipients').value = receiver;
  } else {
    document.querySelector('#compose-recipients').value = sender;
  }
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').append(body);
}
