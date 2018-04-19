(function($) {
    const loadImage = (src) => {
        var dfr = $.Deferred(); //chain object
        var img = new Image();
        img.src = src;
        img.onload = function() {
            dfr.resolve(img); //switch Defered to succes done
        };
        return dfr.promise();
    };



    const renderFsLayer = () => {
        const
            $body = $('body');
        $view = $('<div/>').addClass('full-size-photo').hide().appendTo($body); //insert div
        $zoom = $('<div/>').addClass('full-size-zoom-tool').hide().appendTo($body);
        $zoom.prepend('<img id="loop" src="assets/images/icon.loupe.svg"/>');
        $zoom.find('img').addClass('full-size-zoom-tool-img');
        $arrow = $('<div/>').addClass('full-size-arrow-tool full-size-arrow-tool-right').hide().appendTo($body);
        $arrow.prepend('<img id="arrow" src="assets/images/icon.arrow.svg"/>');
        $arrow.find('img').addClass('full-size-zoom-tool-img');
        $arrowBack = $('<div/>').addClass('full-size-arrow-tool full-size-arrow-tool-left').hide().appendTo($body);
        $arrowBack.prepend('<img id="arrow" src="assets/images/icon.arrow.svg"/>');
        $arrowBack.find('img').addClass('full-size-zoom-tool-img');

        return {
            fading: $('<div/>').addClass('full-size-cover').hide().appendTo($body), // dark background
            view: $view,
            caption: $('<div/>').addClass('full-size-photo__text').hide().appendTo($view),
            zoom: $zoom,
            arrow: $arrow,
            arrowBack: $arrowBack
        };
    };


    class Viewer {

        constructor($context, options = {}) {
            this._o = $.extend({ // merger objects

            }, options);
            const { fading, view, caption, zoom, arrow, arrowBack } = renderFsLayer();
            this.$fadingLayer = fading;
            this.$viewLayer = view;
            this.$zoom = zoom;
            this.$arrow = arrow;
            this.$arrowBack = arrowBack;
            this.$captionLayer = caption;
            this.$fsImg = null;
            this._isZoomed = false;
            this._images = [];
            this._cur = 0;
            this._context = $context.each(function(i) { //cycle operations with DOM-elements
                $(this).data('fsViewerIndex', i);
            });
            this._addUIHandlers();
        }

        get o() {
            return this._o;
        }

        get images() {
            return this._images;
        }

        get $() {
            return this._context;
        }

        close() {
            this.$fadingLayer.fadeOut();
            this.$viewLayer.fadeOut();
            this.$captionLayer.fadeOut(); //TODO: slide bottom
            this.$zoom.fadeOut();
            this.$arrow.fadeOut();
            this.$arrowBack.fadeOut();
        }

        show(index = 1) {
            //TODO: implement
        }

        _addUIHandlers() {
            const closeHandler = (e) => {
                if (!this._isZoomed) {
                    this.close();
                }
            };
            this.$.on('click', this._getClickHandler());
            this.$fadingLayer.on('click', closeHandler);
            this.$viewLayer.on('click', closeHandler);
            this.$zoom.on('click', this._zoom());
            this.$arrow.on('click', this._moveToNextImage(true));
            this.$arrowBack.on('click', this._moveToNextImage(false));
        }

        _galleryTools() {
            this._zoomShowHide();
            this._arrowsShowHide();
        }

        _zoom() {
            const viewer = this;
            const $viewLayer = this.$viewLayer;
            let scrollImg;
            let translate = -50;

            const zoomOut = () => {
                clearInterval(scrollImg);
                $viewLayer.unbind("wheel");
                $viewLayer.find('img').css("max-height", "100%");
                $viewLayer.find('img').css('transform', 'translate(-50%, -50%)');
                $viewLayer.find('img').off('mousemove');
                $viewLayer.find('img').css("cursor", "default");
                viewer._isZoomed = false;
                viewer._arrowsShowHide();
                translate = -50;
            };

            $viewLayer.on('click', () => {
                zoomOut();
            });
            return function(e) {
                $viewLayer.add($zoom).bind("wheel", function() {
                    return false;
                });
                $arrow.hide();
                $arrowBack.hide();
                const imgCenter = $($viewLayer).offset().top + $(window).height() / 2;
                let mouseLastZone = 0;
                const zoneZeroHeight = 60;
                const zoneHeight = 30;
                const mouseCurrentZone = (pageY) => {
                    const topLineZero = imgCenter - (zoneZeroHeight / 2);
                    const bottomLineZero = imgCenter + (zoneZeroHeight / 2);
                    if (pageY < topLineZero) {
                        return Math.ceil((topLineZero - pageY) / zoneHeight);
                    } else if (pageY > bottomLineZero) {
                        return -Math.ceil((pageY - bottomLineZero) / zoneHeight);
                    };
                    return 0;
                }

                if (e && !viewer._isZoomed) {
                    $viewLayer.find('img').css("max-height", "400%");
                    viewer._isZoomed = true;
                    $viewLayer.on("wheel", (event) => { // normal scroll by mousewheel
                        let scrollDirection = event.originalEvent.deltaY;
                        if (scrollDirection < 0 && translate < -12) {
                            translate += 1;
                            $viewLayer.find('img').css('transform', `translate(-50%, ${ translate}%)`);
                        } else if (scrollDirection > 0 && translate > -88) {
                            translate -= 1;
                            $viewLayer.find('img').css('transform', `translate(-50%, ${ translate}%)`);
                        }
                    });

                    $viewLayer.find('img').on('mousemove', (event) => { // scroll by position mouse on screeen, you can delete this block if no need it
                        let mouseNewZone = mouseCurrentZone(event.pageY);
                        if (mouseLastZone !== mouseNewZone) { //mouse cursor change zone
                            mouseLastZone = mouseNewZone;
                            let speed = 400 / Math.abs(Math.pow(mouseNewZone, 3));
                            clearInterval(scrollImg);
                            if (mouseNewZone > 0) {
                                scrollImg = setInterval(function() {
                                    if (translate < -12) {
                                        translate += 0.02;
                                        $viewLayer.find('img').css('transform', `translate(-50%, ${ translate}%)`);
                                    }
                                }, speed);
                                $viewLayer.find('img').css("cursor", "n-resize");
                            } else if (mouseNewZone < 0) {
                                scrollImg = setInterval(function() {
                                    if (translate > -88) {
                                        translate -= 0.02;
                                        $viewLayer.find('img').css('transform', `translate(-50%, ${ translate}%)`);
                                    }
                                }, speed);
                                $viewLayer.find('img').css("cursor", "s-resize");
                            } else {
                                clearInterval(scrollImg);
                                $viewLayer.find('img').css("cursor", "default");
                            }
                        }
                    });
                } else if (e) {
                    zoomOut();
                };
            };
        }

        _zoomShowHide() {
            const viewer = this;
            const fsImg = viewer._getFsImg().get(0);
            if (!($(window).height() > fsImg.height)) {
                viewer.$zoom.show();
            } else viewer.$zoom.hide();
        }

        _arrowsShowHide() {
            const viewer = this;
            const imgLength = viewer._context.length;
            const nextImgId = viewer._cur;
            if (nextImgId === 0) {
                viewer.$arrowBack.hide();
            } else {
                viewer.$arrowBack.show();
            };
            if (nextImgId === (imgLength - 1)) {
                viewer.$arrow.hide();
            } else {
                viewer.$arrow.show();
            };
        }

        _moveToNextImage(moveForward) {
            const viewer = this;
            const imgLength = viewer._context.length - 1;
            return function(e) {
                let animateSetPointOne = '-100%';
                let animateSetPointTwo = '150%';
                if (!moveForward) {
                    animateSetPointOne = '200%';
                    animateSetPointTwo = '-100%';
                }
                let nextImgId = viewer._cur;
                if (moveForward && nextImgId !== imgLength) {
                    nextImgId = ++viewer._cur;
                } else if (nextImgId !== 0) {
                    nextImgId = --viewer._cur;
                };
                // console.log(viewer.$viewLayer.find('img'));
                // console.log(viewer.$viewLayer.find('img')[0]);
                // console.log(viewer.$viewLayer.find('img')[0].currentSrc);

                const imgViewer = viewer.$viewLayer.find('img');

                imgViewer
                    .animate({ left: animateSetPointOne }, () => {
                        imgViewer
                            .attr('src', `${$(viewer._context[nextImgId]).attr('href')}`)
                    })
                    .animate({ left: animateSetPointTwo }, 0);
                const fullImgUrl = viewer.$viewLayer.find('img')[0].src;
                console.log(fullImgUrl);
                $.when(
                    loadImage(fullImgUrl)
                ).then(() => {
                    const fsImg = viewer._getFsImg().get(0);
                    fsImg.src = fullImgUrl;
                    // const imgViewer = viewer.$viewLayer.find('img');
                    // imgViewer[0].onload = () => {
                    //     imgViewer
                    //         .animate({ left: '50%' }, () => {
                    //             viewer._zoomShowHide();
                    //             viewer._arrowsShowHide();
                    //         });
                    // };
                    imgViewer
                        .animate({ left: '50%' }, () => {
                            viewer._zoomShowHide();
                            viewer._arrowsShowHide();
                        });
                });


                // const imgViewer = viewer.$viewLayer.find('img');
                // imgViewer[0].onload = () => {
                //     imgViewer
                //         .animate({ left: '50%' }, () => {
                //             viewer._zoomShowHide();
                //             viewer._arrowsShowHide();
                //         });
                // };
                // imgViewer
                //     .animate({ left: animateSetPointOne }, () => {
                //         imgViewer
                //             .attr('src', `${$(viewer._context[nextImgId]).attr('href')}`)
                //     })
                //     .animate({ left: animateSetPointTwo }, 0, () => {
                //         imgViewer[0].onload();
                //     })
            };
        }

        _animateFs($srcImg) {
            const
                dfr = $.Deferred(),
                srcImg = $srcImg.get(0),
                winW = $(window).width(),
                winH = $(window).height(),
                srcW = $srcImg.width(),
                srcH = $srcImg.height();
            let
                imgW = winW,
                imgH = srcH * (winW / srcW);

            if (imgH > winH) {
                imgW *= (winH / imgH);
                imgH = winH;
            }

            const fxImage = new Image();
            fxImage.src = srcImg.src;
            fxImage.width = srcW;
            fxImage.height = srcH;

            const $fxImage = $(fxImage).addClass('full-size-fx-img').css({
                top: $srcImg.offset().top - $(document).scrollTop(),
                left: $srcImg.offset().left - $(document).scrollLeft()
            }).appendTo('body').animate({
                'top': (winH - imgH) / 2,
                'left': (winW - imgW) / 2,
                'width': imgW,
                'height': imgH
            }, {
                duration: 500, //TODO: hardcode; move to options
                easing: 'easeInQuad', //TODO: hardcode; move to options
                complete: function() {
                    dfr.resolve($fxImage);
                }
            });
            return dfr.promise();
        }

        _getFsImg() {
            if (!this.$fsImg) {
                this.$fsImg = $('<img/>').attr('alt', '').prependTo(this.$viewLayer);
            }
            return this.$fsImg;
        }

        _checkAndShowCaption($src) {
            const
                capSrc = $src.data('fsCaptionFrom'),
                caption = $src.data('fsCaption'),
                showCaption = !!(capSrc || caption);
            if (capSrc) {
                this.$captionLayer.html($(capSrc).html());
            } else if (caption) {
                this.$captionLayer.text(caption);
            }
            showCaption && this.$captionLayer.fadeIn();
        }

        _getClickHandler() {
            const viewer = this;
            return function(e) {
                const
                    $clicked = $(this),
                    fullImgUrl = $clicked.attr('href');
                e.preventDefault();
                viewer._cur = $clicked.data('fsViewerIndex');
                const fxStop = viewer._animateFs($clicked.find('img:first'));
                viewer.$fadingLayer.fadeIn(1000); //TODO: hardcode; move to options
                fxStop.then(($fxImg) => {
                    const fsImg = viewer._getFsImg().get(0);
                    fsImg.src = $fxImg.get(0).src;
                    viewer.$viewLayer.show();
                });
                $.when(
                    fxStop,
                    loadImage(fullImgUrl)
                ).then(($fxImg, fullImg) => {
                    const fsImg = viewer._getFsImg().get(0);
                    fsImg.src = fullImg.src;
                    $fxImg.remove();
                    viewer._checkAndShowCaption($clicked);
                    viewer._galleryTools();
                });

            };
        }

    }


    $.fn.fsViewer = function(options) {
        return new Viewer($(this));
    };


})(window.jQuery);