document.addEventListener("DOMContentLoaded", function(event) {

    const el = document.getElementById('test');


    const SWIPE_MIN_DELTA = 60;
    const SWIPE_LEFT = 'swipe-left';
    const SWIPE_RIGHT = 'swipe-right';

    let touched = false;
    let inSwipeGesture = false;
    let swipeTouchStartPos, swipeTouchCurrentPos;

    class Point {
        constructor(x, y) {
            this.X = x;
            this.Y = y;
        }
    }

    Point.fromTouch = (touch) => {
        return new Point(touch.clientX, touch.clientY);
    };

    const isSwipe = (start, end) => {
        //TODO: check speed also
        const dist = start.X - end.X;
        if (Math.abs(dist) < SWIPE_MIN_DELTA) {
            return false;
        }
        if (dist > 0) {
            return SWIPE_RIGHT;
        }
        return SWIPE_LEFT;
    };

    const logState = () => {
        // console.log('touched:', touched, 'in swipe:', inSwipeGesture);
    };

    const swipeHandler = (start, end) => {
        console.log('swiped', isSwipe(swipeTouchStartPos, swipeTouchCurrentPos));
    };

    const startHandler = (e) => {
        const numberOfTouches = e.touches.length;
        touched = true;
        inSwipeGesture = (numberOfTouches === 1);
        if (inSwipeGesture) {
            swipeTouchStartPos = Point.fromTouch(e.touches[0]);
            //TODO: save start time
        }
        logState();
    };

    const moveHandler = (e) => {
        if (inSwipeGesture) {
            e.preventDefault();
            swipeTouchCurrentPos = Point.fromTouch(e.touches[0]);
        }
    };

    const endHandler = (e) => {
        logState();
        //TODO: pass start time to isSwipe()
        if (inSwipeGesture && isSwipe(swipeTouchStartPos, swipeTouchCurrentPos) && !isZoomed()) {
            e.preventDefault();
            swipeHandler();
        }
    };

    const screenW = () => {
        return screen.width * (window.devicePixelRatio || 1);
    };

    const getZoomLevel = () => {
        return document.documentElement.clientWidth / window.innerWidth;
    };

    const isZoomed = () => {
        return getZoomLevel() > 1.0;
    };

    el.addEventListener('touchstart', startHandler);
    el.addEventListener('touchmove', moveHandler);
    el.addEventListener('touchend', endHandler);

});
















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

// const zoomHandler = () => {
//     imgZoomed = true;
//     const viewer = this;
//     const imgViewer = viewer.$viewLayer.find('img');
//     const deltaXStart = touchStartXY.clientX2 - touchStartXY.clientX; // coordinates of 2 points at the start of event
//     const deltaYStart = touchStartXY.clientY2 - touchStartXY.clientY;
//     const deltaXEnd = touchEndXY.clientX2 - touchEndXY.clientX; // coordinates of 2 points at the end of event
//     const deltaYEnd = touchEndXY.clientY2 - touchEndXY.clientY;
//     const distanceStart = Math.sqrt(Math.pow(deltaXStart, 2) + Math.pow(deltaYStart, 2));
//     const distanceEnd = Math.sqrt(Math.pow(deltaXEnd, 2) + Math.pow(deltaYEnd, 2));
//     const deltaDistance = (distanceEnd - distanceStart);
//     scale += (deltaDistance / 1000);
//     if (scale <= 1) {
//         scale = 1;
//         imgZoomed = false;
//     } else if (scale >= 4) {
//         scale = 4;
//     }
//     const pinchPoint = {
//         pinchX: (touchStartXY.clientX + touchStartXY.clientX2) / 2,
//         pinchY: (touchStartXY.clientY + touchStartXY.clientY2) / 2,
//     }
//     if (deltaDistance > 0 && scale < 4) { // zoom to pinch point
//         if (pinchPoint.pinchX < screenCenterX) {
//             translateX += (((screenCenterX - pinchPoint.pinchX) * scale) / 200);
//         } else {
//             translateX -= (((pinchPoint.pinchX - screenCenterX) * scale) / 200);
//         }

//         if (pinchPoint.pinchY < screenCenterY) {
//             translateY += (((screenCenterY - pinchPoint.pinchY) * scale) / 200);
//         } else {
//             translateY -= (((pinchPoint.pinchY - screenCenterY) * scale) / 200);
//         }
//     }

//     if (deltaDistance < 0) { // unzoom
//         if (!(translateX > -55 && translateX < -45)) {
//             if (translateX < -50) {
//                 translateX += Math.abs(deltaDistance / 20);
//             } else {
//                 translateX -= Math.abs(deltaDistance / 20);
//             }
//         }
//         if (!(translateY > -55 && translateY < -45)) {
//             if (translateY < -50) {
//                 translateY += Math.abs(deltaDistance / 20);
//             } else {
//                 translateY -= Math.abs(deltaDistance / 20);
//             }
//         }
//     }

//     if (scale < 1.05) {
//         translateX = -50;
//         translateY = -50;
//     }

//     imgViewer
//         .css({ transform: `translate(${translateX}%,${translateY}%) scale(${scale})` });
// }

// const exploreZoomedImgHandler = () => {
//     const viewer = this;
//     const imgViewer = viewer.$viewLayer.find('img');
//     const deltaX = touchEndXY.clientX - touchStartXY.clientX;
//     const deltaY = touchEndXY.clientY - touchStartXY.clientY;
//     translateX += deltaX / 5;
//     translateY += deltaY / 5;
//     imgViewer
//         .css({ transform: `translate(${translateX}%,${translateY}%) scale(${scale})` });
//     touchStartXY.clientX = touchEndXY.clientX;
//     touchStartXY.clientY = touchEndXY.clientY;
// }

return function(e) {
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