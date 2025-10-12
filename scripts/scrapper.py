from selenium import webdriver
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import urllib.parse
import time
import json

TIMEOUT = 2
seen = {}

# Keep browser open
opts = webdriver.ChromeOptions()
opts.add_experimental_option("detach", True)
driver = webdriver.Chrome(options=opts)
driver.get("https://pisa.ucsc.edu/cs9/prd/sr9_2013/index.php?action=search&strm=2258")

# ---------- Helpers ----------
def smart_find(xpath: str, timeout: int = TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located((By.XPATH, xpath))
    )

def smart_click(xpath: str, timeout: int = TIMEOUT):
    el = WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((By.XPATH, xpath))
    )
    el.click()

def smart_select_dropdown_value(xpath: str, visible_text: str, timeout: int = TIMEOUT):
    el = WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located((By.XPATH, xpath))
    )
    Select(el).select_by_visible_text(visible_text)

# ---------- DuckDuckGo (your logic) ----------
def duck_search(query: str) -> str | None:
    encoded = urllib.parse.quote_plus(query)
    url = f"https://duckduckgo.com/?q={encoded}&ia=web"

    # Open new tab and switch
    driver.execute_script("window.open('about:blank','_blank');")
    driver.switch_to.window(driver.window_handles[-1])
    driver.get(url)
    time.sleep(2)  # let results load

    try:
        result = WebDriverWait(driver, TIMEOUT).until(
            EC.presence_of_element_located((By.XPATH, '//*[@id="r1-0"]/div[3]/h2/a'))
        ).get_attribute("href")
    except TimeoutException:
        result = None

    # close DDG tab and return to UCSC tab
    driver.close()
    driver.switch_to.window(driver.window_handles[0])

    return result

# ---------- Main scrape ----------
def get_professor_name_and_link():
    for i in range(100):
        try:
            prof_abbrev = smart_find(
                f'//*[@id="rowpanel_{i}"]/div[2]/div/div[2]', timeout=1
            ).text.replace("Instructor:\n", "").strip()

            if not prof_abbrev or prof_abbrev in seen:
                continue

            query = prof_abbrev.replace(",", " ") + " ucsc campus directory"
            campus_link = duck_search(query)

            seen[prof_abbrev] = campus_link
            print(f"[RESOLVED] {prof_abbrev} -> {campus_link}")

        except Exception:
            continue

# ---------- Run ----------
smart_select_dropdown_value('//*[@id="reg_status"]', "All Classes")
smart_click('//*[@id="searchForm"]/div/div[2]/div[17]/div/input')
smart_select_dropdown_value('//*[@id="rec_dur"]', '100')

for _ in range(15):
    get_professor_name_and_link()
    time.sleep(0.25)
    try:
        driver.find_element(By.LINK_TEXT, "next").click()
        time.sleep(1)
    except NoSuchElementException:
        break

with open("prof_names.json", "w", encoding="utf-8") as f:
    json.dump(seen, f, ensure_ascii=False, indent=2)

print("Saved", len(seen), "entries to prof_names.json")
