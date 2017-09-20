function findCamera() {
    var Devices = Windows.Devices.Enumeration;
    return Devices.DeviceInformation.findAllAsync(Devices.DeviceClass.videoCapture)
        .then(function (cameras) {
            if (!cameras || cameras.length === 0) {
                throw new Error("No cameras found");
            }
            var backCameras = cameras.filter(function (camera) {
                return camera.enclosureLocation && camera.enclosureLocation.panel === Devices.Panel.back;
            });
            return (backCameras[0] || cameras[0]).id;
        });
}

(function () {

    var start = document.getElementById("start");
    var capturePreview = document.getElementById("capture-preview");

    start.addEventListener("click", function (e) {
        var capture = new Windows.Media.Capture.MediaCapture();
        findCamera().then(function (id) {
            var captureSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
            captureSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.video;
            captureSettings.photoCaptureSource = Windows.Media.Capture.PhotoCaptureSource.videoPreview;
            //captureSettings.videoDeviceId = id;
            return capture.initializeAsync(captureSettings);
        }).then(function () {
            var controller = capture.videoDeviceController;
            var deviceProps = controller.getAvailableMediaStreamProperties(Windows.Media.Capture.MediaStreamType.videoPreview);
            deviceProps = Array.prototype.slice.call(deviceProps);
            deviceProps = deviceProps.filter(function (prop) {
                // filter out streams with "unknown" subtype - causes errors on some devices
                return prop.subtype !== "Unknown";
            }).sort(function (propA, propB) {
                // sort properties by resolution
                return propB.width - propA.width;
            });

            var preferredProps = deviceProps.filter(function (prop) {
                // Filter out props where frame size is between 640*480 and 1280*720
                return prop.width >= 640 && prop.height >= 480 && prop.width <= 1280 && prop.height <= 720;
            });
            // prefer video frame size between between 640*480 and 1280*720
            // use maximum resolution otherwise
            var maxResProps = preferredProps[0] || deviceProps[0];
            return controller.setMediaStreamPropertiesAsync(Windows.Media.Capture.MediaStreamType.videoPreview, maxResProps)
                .then(function () {
                    return {
                        capture: capture,
                        width: maxResProps.width,
                        height: maxResProps.height
                    };
                });
        }).then(function (captureSettings) {
            capturePreview.msZoom = true;
            capturePreview.src = URL.createObjectURL(capture, { oneTimeOnly: true });
            capturePreview.play();
        });
    });

})();