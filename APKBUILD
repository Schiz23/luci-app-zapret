pkgname=luci-app-zapret
pkgver=0.0.3
pkgrel=1
pkgdesc="Simple LuCI menu for zapret/zapret2"
url="https://github.com/Schiz23/luci-app-zapret"
arch="noarch"
license="MIT"
depends="luci-base"
makedepends=""
options="!check !builddeps"

package() {
    mkdir -p "$pkgdir"/www/luci-static/resources/view/zapret
    mkdir -p "$pkgdir"/usr/share/luci/menu.d
    mkdir -p "$pkgdir"/usr/share/rpcd/acl.d

    cp -a "$startdir"/www/luci-static/resources/view/zapret/status.js \
          "$pkgdir"/www/luci-static/resources/view/zapret/

    cp -a "$startdir"/usr/share/luci/menu.d/luci-app-zapret.json \
          "$pkgdir"/usr/share/luci/menu.d/

    cp -a "$startdir"/usr/share/rpcd/acl.d/luci-app-zapret.json \
          "$pkgdir"/usr/share/rpcd/acl.d/
}
