---
title: "Kingshot on Waydroid(Linux)"
description: "Getting Kingshot running on Waydroid"
publishDate: 2026-06-03
tags: ["linux"]
toc: false
---

While I like to consider my old Nord 2 to be rather decent in terms of specs, making it run a heavy game seems to be the end of its abilities. As always, trying to tinker with my laptop in the hopes that I will find a solution is always the way to go.

Emulating Android on a Linux machine seems a logical choice considering the 'similarities'. 

I am running CachyOS, and I will structure this guide accordingly. It should work with all Linux systems, with the only difference that might arise being in the commands being run for installation considering differing package managers. I use ```yay```, you may adapt for the package manager of your choice.

## Install and Init

Install waydroid using your favorite package manager.

```bash title='installation'
yay -S waydroid
```

Initialise Waydriod, but ensure to use the GAPPS version since we will need Google Play support.

```bash title="init"
waydroid init -s GAPPS
```

You will have to enable the systemd service for waydroid. 

```bash title='service enable'
sudo systemctl enable waydroid-container.service
sudo systemctl start waydroid-container.service
```

## Network

Check if you can access internet before trying this step, if you can access the internet, skip to the next section. If you cannot access the internet, follow along.

To ensure waydroid can access the internet, DNS traffic and packet forwarding will have to be enabled in the kernel. You may have to run these commands as sudo.

```bash title='network access'
ufw allow 67
ufw allow 53
ufw default allow FORWARD
```

## ARM apps

Since Kingshot(or any other game of your choice) on Android would be deployed with ARMv8 in mind, getting them to run on an x86 processor will require a translation layer.

```bash
yay -S waydroid-script-git
```

Since I have an AMD CPU, I installed ```libndk```. If you have an Intel CPU, you may wish to install ```libhoudini```. However, try switching between the layers if one doesn't work or if you run into performance issues.

```bash
waydroid-extras install libndk
```

## Spoofing

Once you open playstore, searching for kingshot gives you the following error: ```this app won't work for your device```. A quick workaround to that is to spoof your device to register as a device which is supported.

Edit the file ```/var/lib/waydroid/waydroid.cfg``` and ```/var/lib/waydroid/waydroid_base.prop```, adding the following lines at the end of the file. Ensure that for ```waydroid.cfg```, the file is added under the ```[properties]``` header.

```bash title='sudo nano /var/lib/waydroid/waydroid.cfg'
ro.product.brand=google
ro.product.manufacturer=Google
ro.system.build.product=redfin
ro.product.name=redfin
ro.product.device=redfin
ro.product.model=Pixel 5
ro.system.build.flavor=redfin-user
ro.build.fingerprint=google/redfin/redfin:11/RQ3A.211001.001/eng.electr.20230318.111310:user/release-keys
ro.system.build.description=redfin-user 11 RQ3A.211001.001 eng.electr.20230318.111310 release-keys
ro.bootimage.build.fingerprint=google/redfin/redfin:11/RQ3A.211001.001/eng.electr.20230318.111310:user/release-keys
ro.build.display.id=google/redfin/redfin:11/RQ3A.211001.001/eng.electr.20230318.111310:user/release-keys
ro.build.tags=release-keys
ro.build.description=redfin-user 11 RQ3A.211001.001 eng.electr.20230318.111310 release-keys
ro.vendor.build.fingerprint=google/redfin/redfin:11/RQ3A.211001.001/eng.electr.20230318.111310:user/release-keys
ro.vendor.build.id=RQ3A.211001.001
ro.vendor.build.tags=release-keys
ro.vendor.build.type=user
ro.odm.build.tags=release-keys
```

Save the files and upgrade waydroid to apply the configuration.

```bash title='apply config'
waydroid upgrade --offline
```

You should be able to run your game of choice. In case you are still not able to, you may try applying a config file to the following location: ```~/.local/share/waydroid/data/vendor/drirc.d/```. Download the config file [here](https://gitlab.freedesktop.org/mesa/mesa/-/raw/main/src/util/00-mesa-defaults.conf) and move it to the given directory.

Apply the following changes to the file:

```json
    <application name="Kingshot" executable="com.run.tower.defense">
        <option name="ignore_discard_framebuffer" value="true" />
        <option name="force_gl_renderer" value="Mali-G710 MP10"/>
        <option name="force_gl_vendor" value="ARM"/>
    </application>
```

Change the name and executable depending on the game you wish to run. The above guide should work for most games.