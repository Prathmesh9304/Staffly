import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdNotifications } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { AiOutlineLogout } from "react-icons/ai";
import { useAuth } from "../../../contexts/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const [notifications, setNotifications] = useState([]);
  const [showNotificationCard, setShowNotificationCard] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const toggleNotificationCard = () => {
    setShowNotificationCard(!showNotificationCard);
    if (showProfileCard) setShowProfileCard(false);
  };

  const toggleProfileCard = () => {
    setShowProfileCard(!showProfileCard);
    if (showNotificationCard) setShowNotificationCard(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target) &&
        showNotificationCard
      ) {
        setShowNotificationCard(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target) &&
        showProfileCard
      ) {
        setShowProfileCard(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotificationCard, showProfileCard]);

  return (
    <div className="bg-white shadow-lg rounded-lg m-4 transition-all duration-300 hover:shadow-xl">
      <div className="flex justify-between items-center p-2">
        <Link
          to="/dashboard"
          className="text-xl text-blue-500 font-bold hover:text-blue-700 transition-colors duration-300"
        >
          Staffly
        </Link>
        <div className="flex items-center">
          {/* <div className="relative mr-4" ref={notificationRef}>
            <MdNotifications
              className="text-2xl cursor-pointer"
              onClick={toggleNotificationCard}
            />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs px-1">
                {notifications.length}
              </span>
            )}
            {showNotificationCard && (
              <div className="absolute right-0 bg-white shadow-lg rounded-lg p-4 mt-2 w-64 transition-transform transform hover:scale-105 duration-300 z-50">
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-500">Nothing to show</p>
                ) : (
                  notifications.map((notification, index) => (
                    <p
                      key={index}
                      className="hover:bg-gray-100 p-2 rounded transition-colors duration-200"
                    >
                      {notification}
                    </p>
                  ))
                )}
              </div>
            )}
          </div> */}
          <div className="relative" ref={profileRef}>
            <FaUserCircle
              className="text-2xl cursor-pointer"
              onClick={toggleProfileCard}
            />
            {showProfileCard && (
              <div className="absolute right-0 bg-white shadow-lg rounded-lg p-4 mt-2 w-48 transition-transform transform hover:scale-105 duration-300 z-50">
                {/* <Link
                  to="/settings"
                  className="hover:bg-gray-100 p-2 rounded transition-colors duration-200 cursor-pointer w-full block"
                >
                  <FiSettings className="inline-block mr-1" /> Settings
                </Link> */}
                <button
                  onClick={handleLogout}
                  className="hover:bg-gray-100 p-2 rounded transition-colors duration-200 cursor-pointer w-full block"
                >
                  <AiOutlineLogout className="inline-block mr-1" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
