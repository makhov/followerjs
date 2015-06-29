# FollowerJS
Simple JS lib to track user activity

```js
Follower.init({
    url: <url_to_send_data>, // required
    timeout: <timeout_to_trigger_that_user is inactive>, // not required, default 5sec
    targetPoints: <target_points_to_send> // not required, default 500
});
```
