require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'CapacitorUniqifyPhotos'
  s.version = package['version']
  s.summary = 'Suppression de photos dans la galerie iOS'
  s.license = 'MIT'
  s.homepage = 'https://github.com/b-t1981/Uniqify'
  s.author = 'Uniqify'
  s.source = { :git => 'https://github.com/b-t1981/Uniqify.git', :tag => s.version.to_s }
  s.source_files = 'ios/Sources/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target = '14.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.1'
end
