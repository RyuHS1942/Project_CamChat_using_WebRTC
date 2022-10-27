package com.webapp.webscoket.controller;

import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;


/**
 * @author user
 *
 */
@Controller
public class MainController {

	@RequestMapping(value = "/")
	public String home() {
		return "redirect:/chat";
	}
	
	/**
	 * 채팅
	 * @return
	 */
	@RequestMapping(value = "/chat")
	public String frontChat(@RequestParam Map<String, String> params, HttpServletRequest req, HttpServletResponse res, ModelMap model) {
		return "chat";
	}

}