$(document).ready(function(){
    var config = {
        API_URL: 'https://newsapi.org/v2',
        API_KEY: ''
    };

    $.ajaxSetup({
        headers: {
            'Authorization': 'Bearer ' + config.API_KEY
        }
    });

    var LocalStorage = {
        getItem: function (key) {
           try{
               var value = localStorage.getItem(key);
              if (value !== null) {
                  value = JSON.parse(value);
                  var expiry = value.__expiry;
                  var now = Date.now();

                  if (now < expiry) {
                      return value.__data;
                  } else {
                      this.removeItem(key);
                  }
              }

               return null;
           }catch (e){
               console.log('Unable to get from localStorage');

               return null;
           }
        },

        setItem: function (key, data, expiry) {
            try {
                var value = {
                    __data: data,
                    __expiry: Date.now() + (parseInt(expiry) * 1000)
                };
                localStorage.setItem(key, JSON.stringify(value));

                return true;
            } catch (e) {
                console.log('Unable to store in localStorage');

                return false;
            }
        },

        removeItem: function (key) {
            try {
                localStorage.removeItem(key);

                return true;
            } catch (e) {
                console.log('Unable to remove from localStorage');

                return false;
            }
        }
    };

    function handleImgError() {
        var imgPlaceholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAABbCAAAAACHC/4YAAABgElEQVRo3u3ZyY7DIAwA0P7/xw5LWAIhZJRMVVGWMhBDL/YdPZFiG9PHzxfigSiiiCKK6CuWYcHK6DEsNkQRRRQYlQQqxP9RAVbwFkQRbQ2ujV7monS7ljo2EaX+udazeah9FR83DWVByVtmoTJA9SxUBagBQkkNFQN2amp7pwHKYVBe/+Im3zpvoFt0JjNB3HPtTmHQa6XnFfVvr5YCVSSXKTW531UoSaFqr8wWuLFdhuxH9ucaigZ5n6iEjEGJD1LQRYiqbb4T1e/3VxL1s8qh7kOpP8rqmSV+gUdNfFe3b4XquppDoyydEMxboTpjBUZtZi5Zk85iCSTKs9OQjvI3Pl830S0/g6nkWJdSpwMVpclPJse6kDod6F6cN0VyrL2AQeWHKVcXPvpdlOyN4/YKgKrmIT9NnVaU+PanBXe3iaueB42dfQGN6/8cNKr/s9BbN/xuNBxm5qFB/W9FueqPBZ90ED3bhYAKjS/biCIKjNphseLf04giiiiiiE6KX7sDMmBJLwaGAAAAAElFTkSuQmCC';
        $("img").each(function(){
            $(this).on('error', function(){
                $(this).unbind('error').attr('src', imgPlaceholder);
            });
        });
    };

    $('#sources-list').on('click', '.source-item', function(){
        $('.source-item').each(function(){
            $(this).removeClass('active');
        });
        $(this).addClass('active');
        var id = $(this).attr('data-id');
        getNews(id);
    });

    $('#message').on('click', '.close', function(){
        $('#message').contents().remove();
    });

    function getNews(sourceId){
        var data = LocalStorage.getItem(sourceId);
        if(data === null){
            $.ajax({url: config.API_URL + '/everything?q=' + sourceId + '&sortBy=publishedAt'})
                .done(function(response) {
                    var articles = formatDate(response.articles);
                    LocalStorage.setItem(sourceId, articles, 1200);
                    render('articles-list-template', 'articles-list', articles, handleImgError);
                }).fail(function(){
                    var data = {message: 'Something went wrong'};
                    render('flash-message-template', 'message', data, hideMessage)
                });
        } else {
            render('articles-list-template', 'articles-list', data, handleImgError);
        }
    }

    (function getSource(){
        var data = LocalStorage.getItem('sources');
        if(data === null){
            $.ajax({url: config.API_URL + '/sources'})
                .done(function(response) {
                    var sources = response.sources;
                    LocalStorage.setItem('sources', sources, 1200);
                    render('sources-list-template', 'sources-list', sources);
                }).fail(function(){
                    var data = {message: 'Something went wrong'};
                    render('flash-message-template', 'message', data, hideMessage)
                });
        } else {
            render('sources-list-template', 'sources-list', data);
        }

    }());

    function render(templateId, divId, data, callback) {
        var sourceTemplate = document.getElementById(templateId).innerHTML;
        var sourceDiv = document.getElementById(divId);
        var compiled = _.template(sourceTemplate, { 'imports': { 'jq': jQuery } });
        sourceDiv.innerHTML = compiled({'data' : data});
        if (typeof callback === 'function') callback();
    }

    function formatDate(articles) {
        var newArticles = [];
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        $.each(articles, function (i, article){
            var date = new Date(Date.parse(article.publishedAt)).toLocaleDateString("en-US", options);
            var articleObj = Object.assign({}, article, {date: date});
            newArticles.push(articleObj);
        });

        return newArticles;
    }

    function hideMessage(){
        setTimeout(function(){
            $('#message').contents().remove();
        }, 3000);
    }
});