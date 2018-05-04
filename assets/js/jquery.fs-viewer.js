(function($) {
    const loadImage = (src) => {
        const dfr = $.Deferred(); // chain object
        const img = new Image();
        img.src = src;
        img.onload = function() {
            dfr.resolve(img); // switch Defered to succes done
        };
        return dfr.promise();
    };


    const renderFsLayer = () => {
        const
            $body = $('body');
        $view = $('<div/>').addClass('full-size-photo').hide().appendTo($body); // insert div
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
            arrowBack: $arrowBack,
        };
    };


    class Viewer {
        constructor($context, options = {}) {
            this._o = $.extend({ // merger objects

            }, options);
            const {
                fading,
                view,
                caption,
                zoom,
                arrow,
                arrowBack,
            } = renderFsLayer();
            this.$fadingLayer = fading;
            this.$viewLayer = view;
            this.$zoom = zoom;
            this.$arrow = arrow;
            this.$arrowBack = arrowBack;
            this.$captionLayer = caption;
            this.$fsImg = null;
            this.advancedScroll = false;
            this._isZoomed = false;
            this._images = [];
            this._cur = 0;
            this._context = $context.each(function(i) { // cycle operations with DOM-elements
                $(this).data('fsViewerIndex', i);
            });
            this._deviceIsMobile = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));
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
            this.$captionLayer.fadeOut(); // TODO: slide bottom
            this.$zoom.fadeOut();
            this.$arrow.fadeOut();
            this.$arrowBack.fadeOut();
        }

        show(index = 1) {
            // TODO: implement
        }

        _addUIHandlers() {
            const closeHandler = (e) => {
                if (!this._isZoomed) {
                    this.close();
                }
            };
            this.$.on('click', this._getClickHandler());
            this.$fadingLayer.on('click', closeHandler);
            if (this._deviceIsMobile) {
                this.$viewLayer.on('touchmove touchstart touchend', this._mobileHandler());
            } else {
                this.$viewLayer.on('click', closeHandler);
            }
            this.$zoom.on('click', this._zoom());
            this.$arrow.on('click', this._moveToNextImage(true));
            this.$arrowBack.on('click', this._moveToNextImage(false));
        }

        _galleryTools() {
            this._zoomShowHide();
            this._arrowsShowHide();
        }

        _mobileHandler() {
            const touchStartXY = {};
            const touchEndXY = {};
            let touchNumberPrevios = 0;
            let imgZoomed = false;
            let scale = 1;
            let translateX = -50;
            let translateY = -50;
            const screenCenterX = $(window).width() / 2;
            const screenCenterY = $(window).height() / 2;

            const swipeHandler = () => {
                const deltaX = touchEndXY.clientX - touchStartXY.clientX;
                const deltaY = touchEndXY.clientY - touchStartXY.clientY;
                const viewer = this;
                const imgViewer = viewer.$viewLayer.find('img');
                if (touchEndXY.touchmove) { // no just one touch and no zoom
                    if ((Math.abs(deltaX) > Math.abs(deltaY)) && (Math.abs(deltaX) > 50)) { // swipe more horizontal and no short
                        if (deltaX < 0) {
                            this._moveToNextImage(true)();
                        } else if (deltaX > 0) {
                            this._moveToNextImage(false)();
                        }
                    } else if ((Math.abs(deltaX) < Math.abs(deltaY)) && (deltaY < 0) && (Math.abs(deltaY) > 100)) { // vertical swipe from bottom to top and no short
                        imgViewer
                            .animate({ top: '25%' }, () => {
                                this.close();
                                imgViewer
                                    .animate({ top: '50%' });
                            });
                    }
                    touchEndXY.touchmove = false;
                }
            };

            const zoomHandler = () => {
                imgZoomed = true;
                const viewer = this;
                const imgViewer = viewer.$viewLayer.find('img');
                const deltaXStart = touchStartXY.clientX2 - touchStartXY.clientX; // coordinates of 2 points at the start of event
                const deltaYStart = touchStartXY.clientY2 - touchStartXY.clientY;
                const deltaXEnd = touchEndXY.clientX2 - touchEndXY.clientX; // coordinates of 2 points at the end of event
                const deltaYEnd = touchEndXY.clientY2 - touchEndXY.clientY;
                const distanceStart = Math.sqrt(Math.pow(deltaXStart, 2) + Math.pow(deltaYStart, 2));
                const distanceEnd = Math.sqrt(Math.pow(deltaXEnd, 2) + Math.pow(deltaYEnd, 2));
                const deltaDistance = (distanceEnd - distanceStart);
                scale += (deltaDistance / 1000);
                if (scale <= 1) {
                    scale = 1;
                    imgZoomed = false;
                } else if (scale >= 4) {
                    scale = 4;
                }
                const pinchPoint = {
                    pinchX: (touchStartXY.clientX + touchStartXY.clientX2) / 2,
                    pinchY: (touchStartXY.clientY + touchStartXY.clientY2) / 2,
                }
                if (deltaDistance > 0 && scale < 4) { // zoom to pinch point
                    if (pinchPoint.pinchX < screenCenterX) {
                        translateX += (((screenCenterX - pinchPoint.pinchX) * scale) / 200);
                    } else {
                        translateX -= (((pinchPoint.pinchX - screenCenterX) * scale) / 200);
                    }

                    if (pinchPoint.pinchY < screenCenterY) {
                        translateY += (((screenCenterY - pinchPoint.pinchY) * scale) / 200);
                    } else {
                        translateY -= (((pinchPoint.pinchY - screenCenterY) * scale) / 200);
                    }
                }

                if (deltaDistance < 0) { // unzoom
                    if (!(translateX > -55 && translateX < -45)) {
                        if (translateX < -50) {
                            translateX += Math.abs(deltaDistance / 20);
                        } else {
                            translateX -= Math.abs(deltaDistance / 20);
                        }
                    }
                    if (!(translateY > -55 && translateY < -45)) {
                        if (translateY < -50) {
                            translateY += Math.abs(deltaDistance / 20);
                        } else {
                            translateY -= Math.abs(deltaDistance / 20);
                        }
                    }
                }

                if (scale < 1.05) {
                    translateX = -50;
                    translateY = -50;
                }

                imgViewer
                    .css({ transform: `translate(${translateX}%,${translateY}%) scale(${scale})` });
            }

            const exploreZoomedImgHandler = () => {
                const viewer = this;
                const imgViewer = viewer.$viewLayer.find('img');
                const deltaX = touchEndXY.clientX - touchStartXY.clientX;
                const deltaY = touchEndXY.clientY - touchStartXY.clientY;
                translateX += deltaX / 5;
                translateY += deltaY / 5;
                imgViewer
                    .css({ transform: `translate(${translateX}%,${translateY}%) scale(${scale})` });
                touchStartXY.clientX = touchEndXY.clientX;
                touchStartXY.clientY = touchEndXY.clientY;
            }

            return function(e) {
                e.preventDefault();
                const numberOfTouches = e.originalEvent.touches.length;
                const touch = e.originalEvent.touches[0];
                const touch2 = e.originalEvent.touches[1];
                if (e.type === 'touchstart') { // combine if 'touchstart' || 'touchmove' don't work. why?
                    touchStartXY.clientX = touch.clientX;
                    touchStartXY.clientY = touch.clientY;
                    if (numberOfTouches === 2) {
                        touchStartXY.clientX2 = touch2.clientX;
                        touchStartXY.clientY2 = touch2.clientY;
                    }
                }
                if (e.type === 'touchmove') {
                    touchEndXY.touchmove = true;
                    touchEndXY.clientX = touch.clientX;
                    touchEndXY.clientY = touch.clientY;
                    touchNumberPrevios = 1;
                    if (imgZoomed && numberOfTouches === 1) {
                        exploreZoomedImgHandler();
                    }
                    if (numberOfTouches === 2) {
                        touchEndXY.clientX2 = touch2.clientX;
                        touchEndXY.clientY2 = touch2.clientY;
                        touchNumberPrevios = 2;
                        zoomHandler();
                    }
                }
                if (e.type === 'touchend' && !imgZoomed && touchNumberPrevios === 1) {
                    swipeHandler();
                }
            };
        }

        _zoom() {
            const viewer = this;
            const $viewLayer = this.$viewLayer;
            let scrollImg;
            let translate = -50;

            const zoomOut = () => {
                clearInterval(scrollImg);
                $viewLayer.unbind('wheel');
                $viewLayer.find('img').css('max-height', '100%');
                $viewLayer.find('img').css('transform', 'translate(-50%, -50%)');
                $viewLayer.find('img').off('mousemove');
                $viewLayer.find('img').css('cursor', 'default');
                $viewLayer.css('overflow-y', '');
                $('body').css('overflow-y', 'inherit');
                viewer._isZoomed = false;
                viewer._arrowsShowHide();
                translate = -50;
            };

            $viewLayer.on('click', () => {
                zoomOut();
            });
            return function(e) {
                $('body').css('overflow-y', 'hidden');
                $viewLayer.css('overflow-y', 'scroll');
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
                    }
                    return 0;
                };

                if (e && !viewer._isZoomed) {
                    $viewLayer.find('img').css('max-height', '400%');
                    viewer._isZoomed = true;
                    if (viewer.advancedScroll) {
                        $viewLayer.find('img').on('mousemove', (event) => { // scroll by position mouse on screeen, you can delete this block if no need it
                            const mouseNewZone = mouseCurrentZone(event.pageY);
                            if (mouseLastZone !== mouseNewZone) { // mouse cursor change zone
                                mouseLastZone = mouseNewZone;
                                const speed = 400 / Math.abs(Math.pow(mouseNewZone, 3));
                                clearInterval(scrollImg);
                                if (mouseNewZone > 0) {
                                    scrollImg = setInterval(() => {
                                        if (translate < -12) {
                                            translate += 0.02;
                                            $viewLayer.find('img').css('transform', `translate(-50%, ${translate}%)`);
                                        }
                                    }, speed);
                                    $viewLayer.find('img').css('cursor', 'n-resize');
                                } else if (mouseNewZone < 0) {
                                    scrollImg = setInterval(() => {
                                        if (translate > -88) {
                                            translate -= 0.02;
                                            $viewLayer.find('img').css('transform', `translate(-50%, ${translate}%)`);
                                        }
                                    }, speed);
                                    $viewLayer.find('img').css('cursor', 's-resize');
                                } else {
                                    clearInterval(scrollImg);
                                    $viewLayer.find('img').css('cursor', 'default');
                                }
                            }
                        });
                    }
                } else if (e) {
                    zoomOut();
                }
            };
        }

        _zoomShowHide() {
            if (!this._deviceIsMobile) {
                const viewer = this;
                const fsImg = viewer._getFsImg().get(0);
                if (!($(window).height() > fsImg.height)) {
                    viewer.$zoom.show();
                } else viewer.$zoom.hide();
            }
        }

        _arrowsShowHide() {
            if (!this._deviceIsMobile) {
                const viewer = this;
                const imgLength = viewer._context.length;
                const nextImgId = viewer._cur;
                if (nextImgId === 0) {
                    viewer.$arrowBack.hide();
                } else {
                    viewer.$arrowBack.show();
                }
                if (nextImgId === (imgLength - 1)) {
                    viewer.$arrow.hide();
                } else {
                    viewer.$arrow.show();
                }
            }
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
                const imgViewer = viewer.$viewLayer.find('img');
                const moveBackOnFirstImg = !moveForward && (nextImgId === 0);
                const moveForwardOnLastImg = moveForward && (nextImgId === imgLength);
                if (moveForward && nextImgId !== imgLength) {
                    nextImgId = ++viewer._cur;
                } else if (!moveForward && nextImgId !== 0) {
                    nextImgId = --viewer._cur;
                }
                if (moveBackOnFirstImg || moveForwardOnLastImg) {
                    if (moveBackOnFirstImg) {
                        imgViewer
                            .animate({ left: '75%' }, () => {
                                imgViewer
                                    .animate({ left: '50%' });
                            });
                    } else {
                        imgViewer
                            .animate({ left: '25%' }, () => {
                                imgViewer
                                    .animate({ left: '50%' });
                            });
                    }
                } else {
                    const fullImgUrl = viewer._context[nextImgId].href;
                    imgViewer
                        .animate({ left: animateSetPointOne }, () => {
                            imgViewer
                                .animate({ left: animateSetPointTwo }, 0);
                            $.when(loadImage(fullImgUrl)).then(() => {
                                const fsImg = viewer._getFsImg().get(0);
                                fsImg.src = fullImgUrl;
                                imgViewer
                                    .animate({ left: '50%' }, () => {
                                        viewer._zoomShowHide();
                                        viewer._arrowsShowHide();
                                    });
                            });
                        });
                }
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
                    left: $srcImg.offset().left - $(document).scrollLeft(),
                }).appendTo('body')
                .animate({
                    top: (winH - imgH) / 2,
                    left: (winW - imgW) / 2,
                    width: imgW,
                    height: imgH,
                }, {
                    duration: 500, // TODO: hardcode; move to options
                    easing: 'easeInQuad', // TODO: hardcode; move to options
                    complete() {
                        dfr.resolve($fxImage);
                    },
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
                viewer.$fadingLayer.fadeIn(1000); // TODO: hardcode; move to options
                fxStop.then(($fxImg) => {
                    const fsImg = viewer._getFsImg().get(0);
                    fsImg.src = $fxImg.get(0).src;
                    viewer.$viewLayer.show();
                });
                $.when(
                    fxStop,
                    loadImage(fullImgUrl),
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
}(window.jQuery));