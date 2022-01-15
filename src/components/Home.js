import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { getTokens } from "../helper";
import { useHistory } from "react-router-dom";
import FullCalendar from "@fullcalendar/react"; // must go before plugins
import dayGridPlugin from "@fullcalendar/daygrid"; // a plugin!
import timeGridPlugin from "@fullcalendar/timegrid";

const triggerURL = "https://api.thecodemesh.com/api/v1/trigger/proxy/61e1db2e2af5fc0012944075/me/events?redirect_url=" + window.location.origin;

const updateQueryStringParameter = (uri, key, value) => {
  var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
  var separator = uri.indexOf("?") !== -1 ? "&" : "?";
  if (uri.match(re)) {
    return uri.replace(re, "$1" + key + "=" + value + "$2");
  } else {
    return uri + separator + key + "=" + value;
  }
};

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const Home = () => {
  // store the tokens if available
  let query = useQuery();
  let loginKey = query.get("loginKey");
  let loginToken = query.get("loginToken");
  const [data, setData] = useState([]);
  const [userLoggedIn, setUserLoggedIn] = useState(0);
  const [theCodeMeshTokens, setTheCodeMeshTokens] = useState(0);
  const [loginUrl, setLoginUrl] = useState("");
  const history = useHistory();

  // Checks if we have loginToken and Window object
  if (loginToken && loginKey && window && localStorage) {
    const tokens = JSON.parse(localStorage.getItem("theCodeMeshTokens")) || {};
    tokens[loginKey] = loginToken;
    localStorage.setItem("theCodeMeshTokens", JSON.stringify(tokens));
    history.replace({ search: null });
  }

  const fetchListOfEvents = () => {
    axios
      .get(`${triggerURL}`, {
        headers: theCodeMeshTokens
      })
      .then(response => {
        setUserLoggedIn(1);
        setData(response.data.value);
      })
      .catch(error => {
        //handle generic errors
        if (error.response.data.code === 400 || error.response.data.code === 401) {
          const scopeKey = error.response.data.message.scopeKey;
          let loginUrl = error.response.data.message.loginUrl;
          if (scopeKey) {
            //update with required scope here
            loginUrl = updateQueryStringParameter(loginUrl, scopeKey, "Calendar.read");
          }
          if (loginUrl) {
            setUserLoggedIn(0);
            setLoginUrl(loginUrl);
          } else {
            //silent fail
            console.log("TheCodeMesh integration failed, trace : ", error.response.data.message.trace);
          }
        }
      });
  };

  useEffect(() => {
    // get code mesh token from the local storage
    if (getTokens()) {
      // storeToken for local usage
      setTheCodeMeshTokens(getTokens());
      // setting user logged in as true
      setUserLoggedIn(1);
    } else {
      fetchListOfEvents();
    }
  }, []);

  useEffect(() => {
    if (theCodeMeshTokens && !data.length) {
      fetchListOfEvents();
    }
  }, [theCodeMeshTokens]);

  const getEvents = () => {
    const events = [];
    data.forEach(eventItem => {
      events.push({ title: eventItem.subject, start: eventItem.start.dateTime, end: eventItem.end.dateTime });
    });
    return events;
  };

  return (
    <React.Fragment>
      {userLoggedIn === 0 && (
        <div>
          Please login with your Microsoft account, <a href={loginUrl}> Click here </a>
        </div>
      )}
      {userLoggedIn === 1 && (
        <div>
          <FullCalendar weekends={true} plugins={[dayGridPlugin, timeGridPlugin]} initialView="dayGridMonth" events={getEvents()} />
        </div>
      )}
    </React.Fragment>
  );
};
export default Home;
