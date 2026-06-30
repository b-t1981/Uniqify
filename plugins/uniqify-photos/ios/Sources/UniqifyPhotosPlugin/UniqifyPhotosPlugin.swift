import Foundation
import Capacitor
import Photos

@objc(UniqifyPhotosPlugin)
public class UniqifyPhotosPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "UniqifyPhotosPlugin"
    public let jsName = "UniqifyPhotos"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "checkAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteAssets", returnType: CAPPluginReturnPromise),
    ]

    private func authStateString(_ status: PHAuthorizationStatus) -> String {
        switch status {
        case .authorized:
            return "authorized"
        case .limited:
            return "limited"
        case .denied, .restricted:
            return "denied"
        case .notDetermined:
            return "notDetermined"
        @unknown default:
            return "denied"
        }
    }

    private func canDelete(with status: PHAuthorizationStatus) -> Bool {
        if #available(iOS 14, *) {
            return status == .authorized || status == .limited
        }
        return status == .authorized
    }

    @objc func checkAuthorization(_ call: CAPPluginCall) {
        let status: PHAuthorizationStatus
        if #available(iOS 14, *) {
            status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        } else {
            status = PHPhotoLibrary.authorizationStatus()
        }
        call.resolve(["state": authStateString(status)])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        let complete: (PHAuthorizationStatus) -> Void = { status in
            call.resolve(["state": self.authStateString(status)])
        }

        if #available(iOS 14, *) {
            PHPhotoLibrary.requestAuthorization(for: .readWrite, handler: complete)
        } else {
            PHPhotoLibrary.requestAuthorization(complete)
        }
    }

    @objc func deleteAssets(_ call: CAPPluginCall) {
        guard let ids = call.getArray("ids", String.self), !ids.isEmpty else {
            call.reject("Liste d'identifiants requise")
            return
        }

        let runDelete = {
            var deleted: [String] = []
            var failed: [String] = []

            PHPhotoLibrary.shared().performChanges({
                for id in ids {
                    let assets = PHAsset.fetchAssets(withLocalIdentifiers: [id], options: nil)
                    if assets.count == 0 {
                        continue
                    }
                    PHAssetChangeRequest.deleteAssets(assets)
                    deleted.append(id)
                }
            }, completionHandler: { success, error in
                if success {
                    for id in ids where !deleted.contains(id) {
                        failed.append(id)
                    }
                    call.resolve([
                        "deleted": deleted,
                        "failed": failed,
                    ])
                } else {
                    call.reject(error?.localizedDescription ?? "Échec de la suppression dans la galerie")
                }
            })
        }

        let status: PHAuthorizationStatus
        if #available(iOS 14, *) {
            status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        } else {
            status = PHPhotoLibrary.authorizationStatus()
        }

        if self.canDelete(with: status) {
            runDelete()
            return
        }

        if #available(iOS 14, *) {
            PHPhotoLibrary.requestAuthorization(for: .readWrite) { newStatus in
                guard self.canDelete(with: newStatus) else {
                    call.reject("Accès à la photothèque refusé. Autorisez la modification dans Réglages > Uniqify.")
                    return
                }
                runDelete()
            }
        } else {
            PHPhotoLibrary.requestAuthorization { newStatus in
                guard self.canDelete(with: newStatus) else {
                    call.reject("Accès à la photothèque refusé. Autorisez la modification dans Réglages > Uniqify.")
                    return
                }
                runDelete()
            }
        }
    }
}
