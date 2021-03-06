// Front Page
function renderFrontPage() {
  $('.app-container').html(`
    <div class="alert-success"><p>This is a really long success test message for styling</p><i id="close-alert" class="fa fa-times" href="#"></i></div>
    <header role="banner" class="header-container">
      <i class="far fa-newspaper"></i>
      <h1 class="header">ArtShare</h1>
      <h2 class="header-tagline">A simple way to share art</h2>
      <div class="auth-actions-container">
        <button id="login" class="auth-actions-button">Login</button>
        <button id="signup" class="auth-actions-button">Sign Up</button>
      </div>
    </header>
    <main role="main">
      <div class="container">
        <section class="pieces" aria-live="assertive">
        </section>
      </div>
      <div class="shadowbox"></div>
    </main>
  `)
  watchSignUpButton(); // Watch for front page sign up button press
  watchLogInButton(); // Watch for front page log in button press
  watchShadowBoxClose(); // Watch the close button at the top of the shadow box
}

// Authentication
function rememberLogIn() {
  $(document).ready(function() {
    if (localStorage.authToken) {
      $.ajax({
        type: "POST",
        url: "/api/auth/refresh",
        dataType: 'json',
        contentType: "application/json",
        beforeSend: function (xhr) {
          xhr.setRequestHeader('Authorization', `Bearer ${localStorage.authToken}`);
        },
        success: function(data) {
          loginSuccessful(data);
        }
      })
    }
  })
}

function watchSignUpButton() {
  $('#signup').on('click', function() {
    $('.shadowbox').fadeIn(200);
    insertShadowBoxHTML(`
      <div class="auth-form-container">
        <i id="close-shadowbox" class="fa fa-times" href="#"></i>
        <h1 class="auth-form-header">Sign Up</h1>
        <div class="alert-error"></div>
        <div class="form-wrapper">
          <form id="sign-up-form" class="auth-form">
            <label for="email">Email</label>
            <input type="email" name="email" required/>
            <label for="username">Username</label>
            <input type="text" name="username" required/>
            <label for="password">Password</label>
            <input type="password" name="password" required/>
            <input id="sign-up-action" type="submit" value="Sign Up"/>
          </form>
        </div>
      </div>
    `);
    watchSignUpAction();
  });
}

function watchSignUpAction() {
  $("#sign-up-form").on('submit', function(e) {
    e.preventDefault();

    userInfo = {};
    $(this).serializeArray().forEach(function(attribute) {
      userInfo[attribute.name] = attribute.value;
    });

    $.ajax({
      type: "POST",
      url: "/api/users",
      dataType: 'json',
      contentType: "application/json",
      data: JSON.stringify(userInfo),
      success: function(data) {
        $('.auth-form-container').fadeOut(200);
        $('.shadowbox').fadeOut(200);
        $('.alert-success p').html(`You've successfully created an account, please Log In.`);
        $('.alert-success').fadeIn(200);
      },
      error: function(err) {
        $('.alert-error').fadeIn(200).html(`
          <p>${err.responseJSON.message}</p>
        `)
      }
    })
  })
}

function watchLogInButton() {
  $('#login').on('click', function() {
    $('.shadowbox').fadeIn(200);
    insertShadowBoxHTML(`
      <div class="auth-form-container">
        <i id="close-shadowbox" class="fa fa-times" href="#"></i>
        <h1 class="auth-form-header">Log In</h1>

        <div class="form-wrapper">
          <div class="alert-error"></div>
          <form id="login-form" class="auth-form">
            <label for="username">Username</label>
            <input type="text" name="username"/>
            <label for="password">Password</label>
            <input type="password" name="password"/>

            <input id="login-action" type="submit" value="Log in"/>
          </form>
          <div class="demo">
            <h4 class="demo-header">Demo Credentials</h4>
            <p class="demo-cred"><strong>Username</strong>: demo123</p>
            <p class="demo-cred"><strong>Password</strong>: demopass</p>
          </div>
        </div>
      </div>
    `);
    watchLogInAction();
  });
}

function watchLogInAction() {
  $("#login-form").on('submit', function(e) {
    e.preventDefault();

    userInfo = {};
    $(this).serializeArray().forEach(function(attribute) {
      userInfo[attribute.name] = attribute.value;
    });

    $.ajax({
      type: "POST",
      url: "/api/auth/login",
      dataType: 'json',
      contentType: "application/json",
      data: JSON.stringify(userInfo),
      success: function(data) {
        loginSuccessful(data)
      },
      error: function(err) {
        $(".alert-error").fadeIn(200).html(`
          <p>Invalid username or password</p>
        `)
      }
    })
  })
}

function loginSuccessful(data) {
  localStorage.setItem('authToken', data.authToken);
  if (data.username && data.gravatar) {
    localStorage.setItem('username', data.username);
    localStorage.setItem('avatar', data.gravatar);
  }
  $('.auth-form-container').fadeOut(200);
  $('.shadowbox').fadeOut(200);
  $('header').fadeOut(200, function() {
    renderLoggedInHeader();
    watchLogout();
    renderTopBarButtons();
    getPieces();
  });
}

// After Authenticated
function renderLoggedInHeader() {
  $('header').css({textAlign: 'left', paddingTop: '40px', minHeight: '0px'}).html(`
    <div class="container">
      <div class="header-left">
        <h1 class="header-2">ArtShare</h1>
        <i class="far fa-newspaper logged-in"></i>
      </div>
      <div class="header-right">
        <img id="current-user-avatar" src="${localStorage.avatar}" alt="${localStorage.username}'s gravatar"/>
        <p id="current-user-username">${localStorage.username} (<button id="logout" href="#">logout</button>)</p>
      </div>
    </div>
  `).fadeIn(200);
}

function watchLogout() {
  $("#logout").on('click', function(e) {
    e.preventDefault();
    localStorage.setItem('authToken', null)
    renderFrontPage();
  });
}

function renderTopBarButtons() {
  $('.pieces').before(`
    <div class="piece-action-button-row">
      <button id="create-piece" class="piece-action-button">Create Post</button>
    </div>
  `)
  watchCreatePieceButton();
}

// Pieces Index and Actions

function getPieces() {
  $.ajax({
    type: "GET",
    url: "/api/pieces",
    dataType: 'json',
    contentType: "application/json",
    beforeSend: function (xhr) {
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.authToken}`);
    },
    success: function(pieces) {
      renderPieces(pieces);
    }
  })
}

function renderPieces(pieces) {
  pieces.reverse().forEach(function(piece) {
    $(".pieces").append(`
      <div class="column-33">
        <article class="piece">
          <div class="piece-image" style="background-image: url(${piece.thumbnailUrl})">
            <section class="piece-info-container">
              <h1 class="piece-title">${piece.title}</h1>
              <p class="piece-tagline">Artist: ${piece.artist}</p>
              <p hidden class="piece-username">posted by ${piece.userName}</p>
              <p hidden class="piece-id">${piece.id}</p>
              <p hidden class="piece-full">${piece.fullImageUrl}</p>
              <p hidden class="piece-body">${piece.body}</p>
              <p hidden class="piece-thumb">${piece.thumbnailUrl}</p>
            </section>
          </div>
        </article>
      </div>
    `)
  })
}

function watchPieces() {
  $('.pieces').on('click', '.piece', function(e) {
    e.preventDefault();
    $('.shadowbox').fadeIn(200);
    pieceFullImage = $(this).find('.piece-full').text();
    pieceThumbnail = $(this).find('.piece-thumb').text();
    pieceTitle = $(this).find('.piece-title').text();
    pieceArtist = $(this).find('.piece-tagline').text()
    pieceBody = $(this).find('.piece-body').text();
    pieceUsername = $(this).find('.piece-username').text().split(' ')[2];
    pieceId = $(this).find('.piece-id').text();


    storageUsername = localStorage.getItem('username');
    insertShadowBoxHTML(`
      <i id="close-shadowbox" class="fa fa-times" href="#"></i>
      <img class="piece-full-image" src="${pieceFullImage}" alt="${pieceTitle}"/>
      <h1 class="piece-full-title">${pieceTitle}</h1>
      <h3 class="piece-full-artist">${pieceArtist}</h3>
      <hr style="width: 120px;"/>
      <h4 class="piece-full-body">${pieceBody}</h4>
      <hr style="width: 120px;"/>
      <p class="piece-full-username">posted by ${pieceUsername}</p>
    `);
    if (pieceUsername === storageUsername) {
      $(".piece-full-username").after(`
        <div class="piece-button-container">
          <button class="piece-update-button">Update Post</button>
          <button class="piece-delete-button">Delete Post</button>
        </div>
        `)
    }
    watchUpdatePieceButton({
      id: pieceId,
      title: pieceTitle,
      body: pieceBody,
      artist: pieceArtist.split(': ')[1],
      thumbnailUrl: pieceThumbnail,
      fullImageUrl: pieceFullImage
    });
    watchDeletePieceButton(pieceId);
  })
}
// Delete Post (Piece)
function watchDeletePieceButton(pieceId) {
  $('.piece-delete-button').on('click', function(e) {
    $.ajax({
      type: "DELETE",
      url: `/api/pieces/${pieceId}`,
      dataType: 'json',
      contentType: "application/json",
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.authToken}`);
      },
      success: function(data) {
        $('.piece-form-container').fadeOut(200);
        $('.shadowbox').fadeOut(200);
        $('.alert-success p').html(`Post deleted successfully`);
        $('.alert-success').fadeIn(200);
        $('.pieces').html(``)
        getPieces();
      },
      error: function(err) {
        $(".alert-error").fadeIn(200).html(`
          <p>${err.responseJSON.message}</p>
        `)
      }
    })
  })
}

// Update Piece
function watchUpdatePieceButton(piece) {
  $('.piece-update-button').on('click', function(e) {
    e.preventDefault;
    insertShadowBoxHTML(`
      <div class="piece-form-container">
        <i id="close-shadowbox" class="fa fa-times" href="#"></i>
        <h1 class="piece-form-header">Update Post</h1>
        <div class="alert-error"></div>
        <div class="form-wrapper">
          <form id="update-piece-form" class="piece-form">
            <input type="hidden" name="id" value="${piece.id}"/>
            <label for="title">Title</label>
            <input type="text" name="title" value="${piece.title}"/>
            <label for="body">Body</label>
            <textarea type="text" name="body">${piece.body}</textarea>
            <label for="artist">Original Artist</label>
            <input type="text" name="artist" value="${piece.artist}"/>
            <label for="thumbnailUrl">Thumbnail URL</label>
            <input type="text" name="thumbnailUrl" value="${piece.thumbnailUrl}"/>
            <label for="fullImageUrl">Full Image URL</label>
            <input type="text" name="fullImageUrl" value="${piece.fullImageUrl}"/>
            <input id="update-piece-action" type="submit" value="Update Post"/>
          </form>
        </div>
      </div>
    `)
    watchUpdatePieceAction();
  })
}

function watchUpdatePieceAction() {
  $('#update-piece-form').on('submit', function(e) {
    e.preventDefault();
    pieceInfo = {};
    $(this).serializeArray().forEach(function(attribute) {
      pieceInfo[attribute.name] = attribute.value;
    });

    $.ajax({
      type: "PUT",
      url: `/api/pieces/${pieceInfo['id']}`,
      dataType: 'json',
      contentType: "application/json",
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.authToken}`);
      },
      data: JSON.stringify(pieceInfo),
      success: function(data) {
        $('.piece-form-container').fadeOut(200);
        $('.shadowbox').fadeOut(200);
        $('.alert-success p').html(`Post updated successfully`);
        $('.alert-success').fadeIn(200);
        $('.pieces').html(``)
        getPieces();
      },
      error: function(err) {
        $(".alert-error").fadeIn(200).html(`
          <p>${err.responseJSON.message}</p>
        `)
      }
    })
  })
}




// Create Post (Piece) Actions
function watchCreatePieceButton() {
  $('#create-piece').on('click', function(e) {
    e.preventDefault();
    $('.shadowbox').fadeIn(200);
    insertShadowBoxHTML(`
      <div class="piece-form-container">
        <i id="close-shadowbox" class="fa fa-times" href="#"></i>
        <h1 class="piece-form-header">Create Post</h1>
        <div class="alert-error"></div>
        <div class="form-wrapper">
          <form id="create-piece-form" class="piece-form">
            <label for="title">Title</label>
            <input type="text" name="title"/>
            <label for="body">Body</label>
            <textarea type="text" name="body"/>
            <label for="artist">Original Artist</label>
            <input type="text" name="artist"/>
            <label for="thumbnailUrl">Thumbnail URL</label>
            <input type="text" name="thumbnailUrl"/>
            <label for="fullImageUrl">Full Image URL</label>
            <input type="text" name="fullImageUrl"/>
            <input id="create-piece-action" type="submit" value="Create Post"/>
          </form>
        </div>
      </div>
    `);
    watchCreatePieceAction();
  })
}

function watchCreatePieceAction() {
  $("#create-piece-form").on('submit', function(e) {
    e.preventDefault();

    pieceInfo = {};
    $(this).serializeArray().forEach(function(attribute) {
      pieceInfo[attribute.name] = attribute.value;
    });

    $.ajax({
      type: "POST",
      url: "/api/pieces",
      dataType: 'json',
      contentType: "application/json",
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.authToken}`);
      },
      data: JSON.stringify(pieceInfo),
      success: function(data) {
        createPieceSuccess(data);
      },
      error: function(err) {
        $(".alert-error").fadeIn(200).html(`
          <p>${err.responseJSON.message}</p>
        `)
      }
    })
  })
}

function createPieceSuccess(piece) {
  $('.piece-form-container').fadeOut(200);
  $('.shadowbox').fadeOut(200);
  $(".pieces").prepend(`
    <div class="column-33">
      <div class="piece">
        <div class="piece-image" style="background-image: url(${piece.thumbnailUrl})">
          <div class="piece-info-container">
            <h1 class="piece-title">${piece.title}</h1>
            <p class="piece-tagline">Artist: ${piece.artist}</p>
            <p hidden class="piece-username">posted by ${piece.userName}</p>
            <p hidden class="piece-id">${piece.id}</p>
            <p hidden class="piece-full">${piece.fullImageUrl}</p>
            <p hidden class="piece-body">${piece.body}</p>
          </div>
        </div>
      </div>
    </div>
  `)
}

// Shadowbox
function insertShadowBoxHTML(htmlToInsert) {
  $('.shadowbox').html(htmlToInsert);
}

function watchShadowBoxClose() {
  $(".shadowbox").on('click', '#close-shadowbox', function(e) {
    $('.auth-form-container').fadeOut(200);
    $('.shadowbox').fadeOut(200);
  });
}

// Alert
function watchAlertClose() {
  $(".alert-success").on('click', '#close-alert', function(e) {
    $('.alert-success').fadeOut(200);
  })
}


// Initialization the Application
function initializeApp() {
  renderFrontPage(); // Render front page
  watchAlertClose(); // Watch for alert close
  watchPieces(); // Watch for each post in the index to be clicked and perform action when that happens
  rememberLogIn(); // Comment out to not remember logged in user
}

initializeApp();
